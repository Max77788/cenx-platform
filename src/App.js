import { Routes, Route } from "react-router-dom";

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { bsc } from "wagmi/chains";

import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Exchange from "./pages/Exchange";
import { MetaMaskProvider } from "./hook";
import ErrorBoundary from "./component/ErrorBoundary";

const chains = [bsc];
const projectId = "eaf4d7570223c6f49e21a36adeabc6a6";
const { publicClient, webSocketPublicClient } = configureChains(chains, [
  w3mProvider({ projectId }),
]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ 
    projectId, 
    chains,
    version: 2,
    enableEIP6963: true,
    enableCoinbase: true,
  }),
  publicClient,
  webSocketPublicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

function App() {
  return (
    <ErrorBoundary>
      <WagmiConfig config={wagmiConfig}>
        <MetaMaskProvider>
          <Routes>
            <Route path="/" element={<Layout client={ethereumClient} />}>
              <Route
                index
                path="/"
                element={<Home client={ethereumClient} />}
              ></Route>
              <Route
                path="/Exchange"
                element={<Exchange client={ethereumClient} />}
              ></Route>
            </Route>
          </Routes>
        </MetaMaskProvider>
      </WagmiConfig>
      <ErrorBoundary>
        <Web3Modal 
          projectId={projectId} 
          ethereumClient={ethereumClient}
          themeMode="light"
          themeVariables={{
            '--w3m-z-index': '9999'
          }}
          enableAccountView={true}
          enableNetworkView={true}
          enableExplorer={false}
        />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
