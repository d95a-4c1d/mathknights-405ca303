import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/context/GameContext";
import Home from "./pages/Home";
import Study from "./pages/Study";
import ChapterPage from "./pages/ChapterPage";
import Challenge from "./pages/Challenge";
import Result from "./pages/Result";
import Missions from "./pages/Missions";
import Growth from "./pages/Growth";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import WrongAnswers from "./pages/WrongAnswers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study" element={<Study />} />
            <Route path="/chapter/:id" element={<ChapterPage />} />
            <Route path="/challenge" element={<Challenge />} />
            <Route path="/result" element={<Result />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/growth" element={<Growth />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/wrong-answers" element={<WrongAnswers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
