import { NextResponse } from "next/server";
import { marketingUrl } from "@/lib/site-urls";

export function GET() {
  return NextResponse.redirect(marketingUrl("/llms.txt"), 301);
}
