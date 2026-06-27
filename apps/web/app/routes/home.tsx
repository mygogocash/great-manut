import { useEffect } from "react";

export function meta() {
  return [{ title: "Great Manut" }];
}

export default function Home() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

  return null;
}
