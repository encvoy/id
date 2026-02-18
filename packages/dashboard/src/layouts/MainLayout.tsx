import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { FC, RefObject } from "react";
import { TopBar } from "src/layouts/components/TopBar";
import { NotificationPanel } from "src/shared/ui/notice/NotificationPanel";
import { Footer } from "src/layouts/components/Footer";

interface MainLayoutProps {
  contentRef: RefObject<HTMLDivElement>;
}

export const MainLayout: FC<MainLayoutProps> = ({ contentRef }) => {
  return (
    <>
      <TopBar />

      <Box ref={contentRef}>
        <Outlet />

        <NotificationPanel />
      </Box>

      <Footer />
    </>
  );
};
