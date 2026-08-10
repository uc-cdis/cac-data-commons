"use client";

import { Box, Burger, Drawer, Group, useMantineTheme } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";

export interface ChatShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  headerContent?: ReactNode;
}

const MOBILE_BAR_HEIGHT = 52;
const SIDEBAR_WIDTH = 340;


export function ChatShell({ sidebar, children, headerContent }: ChatShellProps) {
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);

  useEffect(() => {
    if (isDesktop && mobileOpened) closeMobile();
  }, [isDesktop, mobileOpened, closeMobile]);

  const sidebarBody = (
    <Box
      mih={0}
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
      onClick={(event) => {
        if (!mobileOpened) return;
        // The rename input and the row's action menu need the drawer to stay
        // put. Everything else in here is navigation.
        if ((event.target as HTMLElement).closest("[data-keep-open]")) return;
        closeMobile();
      }}
    >
      {sidebar}
    </Box>
  );

  return (
    <Box
      pb="md"
      mih={0}
      miw={0}
      style={{
        flex: 1,
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Group
        hiddenFrom="sm"
        h={MOBILE_BAR_HEIGHT}
        px="md"
        gap="sm"
        wrap="nowrap"
        style={{
          flexShrink: 0,
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Burger
          opened={mobileOpened}
          onClick={toggleMobile}
          size="sm"
          aria-label="Toggle conversation list"
        />
        {headerContent}
      </Group>

      <Box mih={0} miw={0} style={{ flex: 1, display: "flex" }}>
        <Box
          component="aside"
          visibleFrom="sm"
          w={SIDEBAR_WIDTH}
          p="md"
          mih={0}
          bg="var(--mantine-color-gray-0)"
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderInlineEnd: "1px solid var(--mantine-color-default-border)",
          }}
        >
          {sidebarBody}
        </Box>

        <Drawer
          opened={mobileOpened}
          onClose={closeMobile}
          size={SIDEBAR_WIDTH}
          padding="md"
          withCloseButton={false}
          styles={{
            content: { display: "flex", flexDirection: "column" },
            body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
          }}
        >
          {sidebarBody}
        </Drawer>

        <Box component="section" mih={0} miw={0} style={{ flex: 1, display: "flex" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
