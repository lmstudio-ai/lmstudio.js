<p align="center">
  
  <picture> 
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/lmstudio-ai/lmstudio.js/assets/3611042/dd0b2298-beec-4dfe-9019-7d4dc5427e40">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/lmstudio-ai/lmstudio.js/assets/3611042/70f24e8f-302b-465d-8607-8c3f36cd4934">
    <img alt="lmstudio javascript library logo" src="https://github.com/lmstudio-ai/lmstudio.js/assets/3611042/70f24e8f-302b-465d-8607-8c3f36cd4934" width="290" height="86" style="max-width: 100%;">
  </picture>
  
</p>
<p align="center"><code>Use local LLMs in your JS/TS/Node code.</code></p>
<p align="center"><i>LM Studio Client SDK - Pre-Release</i></p>

### Pre-Release Alpha

`lmstudio.js` is in pre-release alpha, and is undergoing rapid and continuous development. Expect breaking changes!

Follow along for our upcoming announcements about `lmstudio.js` on [Twitter](https://lmstudio.ai/LMStudioAI) and [Discord](https://discord.gg/aPQfnNkxGC).

---

### Installation

```shell
npm install @lmstudio/sdk
```

### Usage

```ts
import { LMStudioClient } from "@lmstudio/sdk";

const lmstudio = new LMStudioClient();

async function main() {
  const llama3 = await lmstudio.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF");
  const result = await llama3.complete("# A function to print the digits of pi\ndef print_pi():");
  console.log(result.content);
  console.log(result.stats);
}

main();
```

## Getting Started

### Set up `lms` (CLI)

`lms` is the CLI tool for LM Studio. It is shipped with the latest versions of [LM Studio](https://lmstudio.ai/). To set it up, run the following command:

- **Windows**:

  ```shell
  cmd /c %USERPROFILE%/.cache/lm-studio/bin/lms.exe bootstrap
  ```

- **Linux/macOS**:

  ```shell
  ~/.cache/lm-studio/bin/lms bootstrap
  ```

To check if the bootstrapping was successful, run the following in a **👉 new terminal window 👈**:

```shell
lms
```

> [!NOTE]
>
> `lms` is only shipped with the latest version of [LM Studio](https://lmstudio.ai/) (v0.2.22 and onwards). Please make sure you have the latest version installed.

## Start the local LLM server

### Node.js script

Start the server by running:

```shell
lms server start
```

### Web app

If you are developing a web application and/or need to enable CORS (Cross Origin Resource Sharing), run this instead:

```shell
lms server start --cors=true
```

### Override the default port

```shell
lms server start --port 12345
```

## Examples

### Loading an LLM and Predicting with It

This example loads a model `"lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF"` and predicts text with it.

```ts
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();

// Load a model
const llama3 = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF");

// Create a text completion prediction
const prediction = llama3.complete("The meaning of life is");

// Stream the response
for await (const text of prediction) {
  process.stdout.write(text);
}
```

> [!NOTE]
>
> **About `process.stdout.write`**
>
> `process.stdout.write` is a [Node.js-specific function](https://nodejs.org/api/process.html#processstdout) that allows you to print text without a newline.
>
> On the browser, you might want to do something like:
>
> ```ts
> // Get the element where you want to display the output
> const outputElement = document.getElementById("output");
>
> for await (const text of prediction) {
>   outputElement.textContent += text;
> }
> ```

### Using a Non-Default LM Studio Server Port

This example shows how to connect to LM Studio running on a different port (e.g., 8080).

```ts
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient({
  baseUrl: "ws://127.0.0.1:8080",
});

// client.llm.load(...);
```

### Loading a Model and Keeping It Loaded After Client Exit (daemon mode)

By default, when your client disconnects from LM Studio, all models loaded by that client are unloaded. You can prevent this by setting the `noHup` option to `true`.

```ts
await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
  noHup: true,
});

// The model stays loaded even after the client disconnects
```

### Giving a Loaded Model a Friendly Name

You can set an identifier for a model when loading it. This identifier can be used to refer to the model later.

```ts
await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
  identifier: "my-model",
});

// You can refer to the model later using the identifier
const myModel = await client.llm.get("my-model");
// myModel.complete(...);
```

### Loading a Model with a Custom Configuration

By default, the load configuration for a model comes from the preset associated with the model (Can be changed on the "My Models" page in LM Studio).

```ts
const llama3 = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
  config: {
    contextLength: 1024,
    gpuOffload: 0.5, // Offloads 50% of the computation to the GPU
  },
});

// llama3.complete(...);
```

### Loading a Model with a Specific Preset

The preset determines the default load configuration and the default inference configuration for a model. By default, the preset associated with the model is used. (Can be changed on the "My Models" page in LM Studio). You can change the preset used by specifying the `preset` option.

```ts
const llama3 = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
  preset: "My ChatML",
});
```

### Custom Loading Progress

You can track the loading progress of a model by providing an `onProgress` callback.

```ts
const llama3 = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
  verbose: false, // Disables the default progress logging
  onProgress: progress => {
    console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
  },
});
```

### Listing all Models that can be Loaded

If you wish to find all models that are available to be loaded, you can use the `listDownloadedModel` method on the `system` object.

```ts
const downloadedModels = await client.system.listDownloadedModels();
const downloadedLLMs = downloadedModels.filter(model => model.type === "llm");

// Load the first model
const model = await client.llm.load(downloadedLLMs[0].path);
// model.complete(...);
```

### Canceling a Load

You can cancel a load by using an AbortController.

```ts
const controller = new AbortController();

try {
  const llama3 = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
    signal: controller.signal,
  });
  // llama3.complete(...);
} catch (error) {
  console.error(error);
}

// Somewhere else in your code:
controller.abort();
```

> [!NOTE]
>
> **About `AbortController`**
>
> AbortController is a standard JavaScript API that allows you to cancel asynchronous operations. It is supported in modern browsers and Node.js. For more information, see the [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

### Unloading a Model

You can unload a model by calling the `unload` method.

```ts
const llama3 = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", {
  identifier: "my-model",
});

// ...Do stuff...

await client.llm.unload("my-model");
```

Note, by default, all models loaded by a client are unloaded when the client disconnects. Therefore, unless you want to precisely control the lifetime of a model, you do not need to unload them manually.

> [!NOTE]
>
> **Keeping a Model Loaded After Disconnection**
>
> If you wish to keep a model loaded after disconnection, you can set the `noHup` option to `true` when loading the model.

### Using an Already Loaded Model

To look up an already loaded model by its identifier, use the following:

```ts
const myModel = await client.llm.get({ identifier: "my-model" });
// Or just
const myModel = await client.llm.get("my-model");

// myModel.complete(...);
```

To look up an already loaded model by its path, use the following:

```ts
// Matches any quantization
const llama3 = await client.llm.get({ path: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF" });

// Or if a specific quantization is desired:
const llama3 = await client.llm.get({
  path: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
});

// llama3.complete(...);
```

### Using any Loaded Model

If you do not have a specific model in mind, and just want to use any loaded model, you can simply pass in an empty object to `client.llm.get`.

```ts
const anyModel = await client.llm.get({});
// anyModel.complete(...);
```

### Listing All Loaded Models

To list all loaded models, use the `client.llm.listLoaded` method.

```ts
const loadedModels = await client.llm.listLoaded();

if (loadedModels.length === 0) {
  throw new Error("No models loaded");
}

// Use the first one
const firstModel = await client.llm.get({ identifier: loadedModels[0].identifier });
// firstModel.complete(...);
```

### Text Completion

To perform text completion, use the `complete` method:

```ts
const prediction = model.complete("The meaning of life is");

for await (const text of prediction) {
  process.stdout.write(text);
}
```

By default, the inference parameters in the preset is used for the prediction. You can override them like this:

```ts
const prediction = anyModel.complete("Meaning of life is", {
  contextOverflowPolicy: "stopAtLimit",
  maxPredictedTokens: 100,
  prePrompt: "Some pre-prompt",
  stopStrings: ["\n"],
  temperature: 0.7,
});

// ...Do stuff with the prediction...
```

### Conversation

To perform a conversation, use the `respond` method:

```ts
const prediction = anyModel.respond([
  { role: "system", content: "Answer the following questions." },
  { role: "user", content: "What is the meaning of life?" },
]);

for await (const text of prediction) {
  process.stdout.write(text);
}
```

Similarly, you can override the inference parameters for the conversation (Note the available options are different from text completion):

```ts
const prediction = anyModel.respond(
  [
    { role: "system", content: "Answer the following questions." },
    { role: "user", content: "What is the meaning of life?" },
  ],
  {
    contextOverflowPolicy: "stopAtLimit",
    maxPredictedTokens: 100,
    stopStrings: ["\n"],
    temperature: 0.7,
    inputPrefix: "Q: ",
    inputSuffix: "\nA:",
  },
);

// ...Do stuff with the prediction...
```

> [!IMPORTANT]
>
> _Always Provide the Full History/Context_
>
> LLMs are _stateless_. They do not remember or retain information from previous inputs. Therefore, when predicting with an LLM, you should always provide the full history/context.

### Getting Prediction Stats

If you wish to get the prediction statistics, you can await on the prediction object to get a `PredictionResult`, through which you can access the stats via the `stats` property.

```ts
const prediction = model.complete("The meaning of life is");

for await (const text of prediction) {
  process.stdout.write(text);
}

const { stats } = await prediction;
console.log(stats);
```

> [!NOTE]
>
> **No Extra Waiting**
>
> When you have already consumed the prediction stream, awaiting on the prediction object will not cause any extra waiting, as the result is cached within the prediction object.
>
> On the other hand, if you only care about the final result, you don't need to iterate through the stream. Instead, you can await on the prediction object directly to get the final result.
>
> ```ts
> const prediction = model.complete("The meaning of life is");
> const result = await prediction;
> const content = result.content;
> const stats = result.stats;
>
> // Or just:
>
> const { content, stats } = await model.complete("The meaning of life is");
> ```

### Producing JSON (Structured Output)

LM Studio supports structured prediction, which will force the model to produce content that conforms to a specific structure. To enable structured prediction, you should set the `structured` field. It is available for both `complete` and `respond` methods.

Here is an example of how to use structured prediction:

```ts
const prediction = model.complete("Here is a joke in JSON:", {
  maxPredictedTokens: 100,
  structured: { type: "json" },
});

const result = await prediction;
try {
  // Although the LLM is guaranteed to only produce valid JSON, when it is interrupted, the
  // partial result might not be. Always check for errors. (See below)
  const parsed = JSON.parse(result.content);
  console.info(parsed);
} catch (e) {
  console.error(e);
}
```

Sometimes, any JSON is not enough. You might want to enforce a specific JSON schema. You can do this by providing a JSON schema to the `structured` field. Read more about JSON schema at [json-schema.org](https://json-schema.org/).

```ts
const schema = {
  type: "object",
  properties: {
    setup: { type: "string" },
    punchline: { type: "string" },
  },
  required: ["setup", "punchline"],
};

const prediction = llama3.complete("Here is a joke in JSON:", {
  maxPredictedTokens: 100,
  structured: { type: "json", jsonSchema: schema },
});

const result = await prediction;
try {
  const parsed = JSON.parse(result.content);
  console.info("The setup is", parsed.setup);
  console.info("The punchline is", parsed.punchline);
} catch (e) {
  console.error(e);
}
```

> [!IMPORTANT]
>
> **Caveats with Structured Prediction**
>
> - Although the model is forced to generate predictions that conform to the specified structure, the prediction may be interrupted (for example, if the user stops the prediction). When that happens, the partial result may not conform to the specified structure. Thus, always check the prediction result before using it, for example, by wrapping the `JSON.parse` inside a try-catch block.
> - In certain cases, the model may get stuck. For example, when forcing it to generate valid JSON, it may generate a opening brace `{` but never generate a closing brace `}`. In such cases, the prediction will go on forever until the context length is reached, which can take a long time. Therefore, it is recommended to always set a `maxPredictedTokens` limit. This also contributes to the point above.

### Canceling a Prediction

A prediction may be canceled by calling the `cancel` method on the prediction object.

```ts
const prediction = model.complete("The meaning of life is");

// ...Do stuff...

prediction.cancel();
```

When a prediction is canceled, the prediction will stop normally but with `stopReason` set to `"userStopped"`. You can detect cancellation like so:

```ts
for await (const text of prediction) {
  process.stdout.write(text);
}
const { stats } = await prediction;
if (stats.stopReason === "userStopped") {
  console.log("Prediction was canceled by the user");
}
```
