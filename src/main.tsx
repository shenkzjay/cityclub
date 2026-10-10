import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router";
import { TRPCProvider } from "./provider.tsx";
import { RootLayout } from "./components/RootLayout";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <TRPCProvider>
      <RootLayout />
    </TRPCProvider>
  </BrowserRouter>
);