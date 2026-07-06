"use server";

import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";
import { importBeneficiaries } from "./actions";

// KoboToolbox field names vary by form design, so we check a handful of
// common candidates (and group-prefixed variants like "group/full_name")
// rather than requiring an exact match.
const FIELD_CANDIDATES = {
  name: ["full_name", "name", "respondent_name", "beneficiary_name"],
  phone: ["phone_number", "phone", "mobile", "contact"],
  gender: ["gender", "sex"],
  age: ["age", "years"],
  age_group: ["age_group"],
  district: ["district", "location"],
  village: ["village"],
};

function findField(submission, keys) {
  const entries = Object.keys(submission);
  for (const key of keys) {
    const match = entries.find((e) => e.toLowerCase() === key || e.toLowerCase().endsWith("/" + key));
    if (match && submission[match] !== undefined && submission[match] !== "") return submission[match];
  }
  return "";
}

function ageFromGroup(ageGroup) {
  const map = { child: 10, youth: 20, adult: 35, elderly: 65 };
  return map[String(ageGroup || "").toLowerCase()] || "";
}

export async function importFromKobo({ apiToken, formUid, server, defaultSector, projectId }) {
  if (!apiToken || !apiToken.trim()) return { error: "API Token is required." };
  if (!formUid || !formUid.trim()) return { error: "Form UID is required." };

  const baseUrl = (server && server.trim()) || "https://kf.kobotoolbox.org";
  let url = `${baseUrl}/api/v2/assets/${formUid.trim()}/data/?format=json`;
  const allResults = [];
  let pageCount = 0;

  try {
    while (url && pageCount < 20) { // safety cap: 20 pages
      const res = await fetch(url, {
        headers: { Authorization: `Token ${apiToken.trim()}` },
      });

      if (res.status === 401 || res.status === 403) {
        return { error: "Authentication failed — check your API Token." };
      }
      if (res.status === 404) {
        return { error: "Form not found — check the Form UID and server address." };
      }
      if (!res.ok) {
        return { error: `KoboToolbox returned an error (status ${res.status}).` };
      }

      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      allResults.push(...results);
      url = data.next || null;
      pageCount++;
    }
  } catch (e) {
    return { error: "Could not reach KoboToolbox. Check your internet connection and the server address." };
  }

  if (allResults.length === 0) {
    return { error: "No submissions found for this form." };
  }

  const rows = allResults.map((submission) => {
    const genderRaw = String(findField(submission, FIELD_CANDIDATES.gender) || "").toLowerCase();
    const sex = genderRaw.startsWith("f") ? "Female" : genderRaw.startsWith("m") ? "Male" : "";

    const directAge = findField(submission, FIELD_CANDIDATES.age);
    const age = directAge || ageFromGroup(findField(submission, FIELD_CANDIDATES.age_group));

    const village = findField(submission, FIELD_CANDIDATES.village);
    const district = findField(submission, FIELD_CANDIDATES.district);

    return {
      name: findField(submission, FIELD_CANDIDATES.name),
      phone: findField(submission, FIELD_CANDIDATES.phone),
      sex,
      age,
      district: village ? `${village}, ${district}` : district,
      sector: defaultSector || "education",
    };
  });

  const projects = await prisma.project.findMany();
  const filteredRows = projectId ? rows.map((r) => ({ ...r, project: projects.find((p) => p.id === Number(projectId))?.name || "" })) : rows;

  const result = await importBeneficiaries(filteredRows, projects);

  const session = await auth();
  await logActivity(
    session?.user?.name,
    "Imported from KoboToolbox",
    `Form ${formUid}: ${result.created} created, ${result.skipped.length} skipped out of ${allResults.length} submissions`,
    session?.user?.email
  );

  return { ...result, fetchedFromKobo: allResults.length };
}
