import ChatBot from "./components/ChatBot";

export default function App() {
  const ollamaApiUrl = "https://67b0-2a02-4780-10-9c36-00-1.ngrok-free.app/api/generate";

  return (
    <div className="App bg-gray-900 min-h-screen text-gray-100 flex flex-col">
      <h1 className="text-3xl font-extrabold text-center my-6 select-none">
        BuBot{" "}
        <span className="font-normal text-gray-400">– your AI assistant</span>
      </h1>
      <div className="flex-grow px-4">
        <ChatBot apiEndpoint={ollamaApiUrl} modelName="llama3:latest" />
      </div>
    </div>
  );
}
