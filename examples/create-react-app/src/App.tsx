import { useEffect, useState } from "react";
import "./App.css";

import {
  DownloadedModel,
  LLMLoadModelOpts,
  LLMPredictionStats,
  LMStudioClient,
  OngoingPrediction,
} from "@lmstudio/sdk";

function LoadedModelWidget({
  client,
  loadedModels,
  onUnloadModel,
}: {
  client: LMStudioClient;
  loadedModels: { identifier: string; path: string }[];
  onUnloadModel: (model: string) => void;
}) {
  const [selectedModel, setSelectedModel] = useState(loadedModels[0].path);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<LLMPredictionStats | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<OngoingPrediction | null>(null);

  const handleSubmit = async () => {
    setStats(null);
    setPrediction(null);

    const model = client.llm.get({ identifier: selectedModel });
    const prediction = model?.complete(message);
    setPrediction(prediction);

    setIsPredicting(true);
    for await (const fragment of prediction) {
      console.log(fragment);
      setMessage(old => old + fragment);
    }
    setIsPredicting(false);

    const { stats } = await prediction;
    setStats(stats);
  };

  const handleStopPrediction = () => {
    console.log("Stopping prediction...");
    prediction?.cancel();
    setIsPredicting(false);
  };

  const handleClear = () => {
    setMessage("");
    setStats(null);
    setPrediction(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "center",
        backgroundColor: "lightgray",
        padding: "30px",
        width: "50%",
        margin: "auto",
        marginTop: "20px",
      }}
    >
      <h1>Prompt an LLM</h1>
      <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center" }}>
        <span>🤖</span>
        <select
          style={{ height: "22px" }}
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
        >
          {loadedModels.map((model, index) => (
            <option key={index} value={model.identifier}>
              {model.identifier}
            </option>
          ))}
        </select>
        <button onClick={() => onUnloadModel(selectedModel)}>Unload</button>
      </div>
      <textarea
        value={message}
        placeholder="Type your message here..."
        onChange={e => setMessage(e.target.value)}
        style={{ width: "100%", height: "100px", padding: "10px", fontSize: "16px" }}
      />
      {!isPredicting ? (
        <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center" }}>
          <button onClick={handleSubmit}>🔮 Predict</button>
          <button onClick={handleClear}>🔄 Start Over</button>
        </div>
      ) : (
        <button onClick={handleStopPrediction}>Stop Prediction</button>
      )}

      <div style={{ width: "100%", padding: "10px", fontSize: "16px", textAlign: "left" }}>
        {stats && (
          <div style={{ width: "100%", padding: "10px", fontSize: "12px", textAlign: "left" }}>
            <pre>Prediction Stats</pre>
            <pre>{JSON.stringify(stats, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [models, setModels] = useState<DownloadedModel[]>([]);
  const [loadedModels, setLoadedModels] = useState<{ identifier: string; path: string }[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);

  const client = new LMStudioClient();

  useEffect(() => {
    client.system.listDownloadedModels().then(downloadedModels => {
      setModels(downloadedModels);
    });
  }, []);

  useEffect(() => {
    client.llm.listLoaded().then(loadedModels => {
      setLoadedModels(loadedModels);
      console.log("Loaded models:", loadedModels);
    });
  }, [isLoading, isUnloading]);

  const handleUnloadModel = async (model: string) => {
    // Add your unload logic here
    console.log(`Unloading model: ${model}`);
    setIsUnloading(true);
    await client.llm.unload(model);
    setIsUnloading(false);
    console.log(`Model unloaded: ${model}`);
  };

  const loadModel = async (model: string) => {
    if (!model || model === "") {
      return;
    }
    const opts: LLMLoadModelOpts = {
      onProgress: (progress: number) => {
        setLoadingProgress(progress);
        console.log(progress);
      },
      noHup: true,
    };

    setIsLoading(true);
    const result = await client.llm.load(model + "asd", opts);
    setIsLoading(false);
    const info = await result.getModelInfo();
    console.log(`Model loaded: ${info?.identifier}`);
    setLoadedModels([
      ...loadedModels,
      { identifier: info?.identifier || "", path: info?.path || "" },
    ]);
  };

  return (
    <div className="App">
      <h1>👾 LM Studio SDK</h1>
      <h2>React App Example</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "center",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <h3>Load local LLMs:</h3>
        <select onChange={e => loadModel(e.target.value)} style={{ height: "30px" }}>
          <option value="">Select a model to load</option>
          {models.map((model, index) => (
            <option key={index} value={model.path}>
              {model.path}
            </option>
          ))}
        </select>
      </div>
      {isLoading && (
        <>
          <p>Loading...</p>
          <progress value={loadingProgress} max="1" />
        </>
      )}

      {loadedModels.length > 0 && (
        <LoadedModelWidget
          client={client}
          loadedModels={loadedModels}
          onUnloadModel={handleUnloadModel}
        />
      )}
    </div>
  );
}

export default App;
