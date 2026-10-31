import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ChatShellHost } from "@/components/app/ChatShellHost";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "محادثات فريقك | زياد" }, { name: "description", content: "تواصل مع موظفي زياد وراجع مهام فريقك في مساحة العمل." }, { property: "og:title", content: "محادثات فريقك | زياد" }, { property: "og:description", content: "محادثات الموظفين ومهام فريقك في مساحة زياد." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <ChatShellHost>
      <Outlet />
    </ChatShellHost>
  ),
});
