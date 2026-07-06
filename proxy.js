import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isChangePasswordPage = req.nextUrl.pathname === "/change-password";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (isLoggedIn && req.auth.user.mustChangePassword && !isChangePasswordPage) {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl));
  }

  if (isLoggedIn && !req.auth.user.mustChangePassword && isChangePasswordPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
