const TZ_DISTRICTS = require("./tanzania-districts");
const REGION_COORDS = require("./tanzania-region-coords");

function districtToRegionMap() {
  const map = {};
  TZ_DISTRICTS.forEach((r) => {
    r.districts.forEach((d) => { map[d] = r.region; });
  });
  return map;
}

// Aggregates projects and beneficiaries by region, returning only regions
// that have any real activity, each with a coordinate for mapping.
function buildRegionPrevalence(projects, beneficiaries) {
  const d2r = districtToRegionMap();
  const byRegion = {};

  function bump(district, key) {
    const region = d2r[district] || null;
    if (!region) return;
    if (!byRegion[region]) byRegion[region] = { region, projects: 0, beneficiaries: 0 };
    byRegion[region][key] += 1;
  }

  projects.forEach((p) => bump(p.district, "projects"));
  beneficiaries.forEach((b) => bump(b.district, "beneficiaries"));

  return Object.values(byRegion)
    .filter((r) => REGION_COORDS[r.region])
    .map((r) => ({ ...r, coords: REGION_COORDS[r.region] }));
}

module.exports = { buildRegionPrevalence, districtToRegionMap };
