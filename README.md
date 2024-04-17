<p align="center">
  
  <picture> 
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/lmstudio-ai/lmstudio.js/assets/3611042/dd0b2298-beec-4dfe-9019-7d4dc5427e40">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/lmstudio-ai/lmstudio.js/assets/3611042/70f24e8f-302b-465d-8607-8c3f36cd4934">
    <img alt="lmstudio javascript library logo" src="https://github.com/lmstudio-ai/lmstudio.js/assets/3611042/70f24e8f-302b-465d-8607-8c3f36cd4934" width="290" height="86" style="max-width: 100%;">
  </picture>
  
</p>
<p align="center"><code>Use local LLMs in your JS/TS/Node code.</code></p>
<p align="center"><i>LM Studio Client SDK - Pre-Release</i></p>

> **NOTE**: 👉 `lmstudio.js` is in early alpha. Expect breaking changes.

#### You need a special LM Studio build to use `lmstudio.js`

| Platform       | LM Studio Installer                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Mac (M1/M2/M3) | [0.2.19 + lmstudio.js (.dmg)](https://releases.lmstudio.ai/mac/arm64/0.2.19/mit-hackathon/LM-Studio-0.2.19-arm64.dmg)                |
| Windows        | [0.2.19 + lmstudio.js (.exe) ](https://files.lmstudio.ai/windows/LM-Studio-0.2.19-mit-hackathon-SDK/beta/LM-Studio-0.2.19-Setup.exe) |
| Linux          | _Linux build not yet available_                                                                                                      |

### Installation

```shell
npm install @lmstudio/sdk
```

### Usage

```ts
import { LMStudioClient } from "@lmstudio/sdk";

const lmstudio = new LMStudioClient();

async function main() {
  const codegemma = await lmstudio.llm.load("lmstudio-community/codegemma-2b-GGUF");
  const result = await codegemma.complete(
    "# A function to print the digits of pi\ndef print_pi():",
  );
  console.log(result.content);
  console.log(result.stats);
}

main();
```

## Getting Started

## Set up `lms` (cli)

LM Studio builds linked above ship with the new `lms` cli. Follow the instructions below to add it to your terminal's autocomplete.

#### macOS / Linux

- **Zsh**

```bash
echo 'export PATH="$HOME/.cache/lmstudio/bin:$PATH"' >> ~/.zshrc
```

- **Bash**

```bash
echo 'export PATH="$HOME/.cache/lmstudio/bin:$PATH"' >> ~/.bashrc
```

> Not sure which shell you're using? Pop open your terminal and run `echo $SHELL` to find out. `/bin/zsh` means you're using Zsh, `/bin/bash` means you're using Bash.

#### Windows

- `lms.exe` should already be in your PATH after installation. Test it by running `lms.exe` in powershell or cmd.

## Start the local LLM server

### NodeJS script

Start the server by running:

```shell
lms server start
```

### Web app

If you need to enable CORS (Cross Origin Resource Sharing), run this:

```shell
lms server start --cors=true
```

### Override the default port

```shell
lms server start --port 12345
```

## Examples

### Loading an LLM and Predicting with It

This example loads a model `"NousResearch/Hermes-2-Pro-Mistral-7B-GGUF"` and predicts text with it.

```ts
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();

// Load a model
const hermes = await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF");

// Create a text completion prediction
const prediction = hermes.complete("The meaning of life is");

// Stream the response
for await (const text of prediction) {
  process.stdout.write(text);
}
```

> [!NOTE] > **About `process.stdout.write`**
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
await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
  noHup: true,
});

// The model stays loaded even after the client disconnects
```

### Giving a Loaded Model a Friendly Name

You can set an identifier for a model when loading it. This identifier can be used to refer to the model later.

```ts
await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
  identifier: "my-model",
});

// You can refer to the model later using the identifier
const myModel = client.llm.get("my-model");
// myModel.complete(...);
```

### Loading a Model with a Custom Configuration

By default, the load configuration for a model comes from the preset associated with the model (Can be changed on the "My Models" page in LM Studio).

```ts
const hermes = await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
  config: {
    contextLength: 1024,
  },
  acceleration: {
    acceleration: { offload: 0.5 }, // Offloads 50% of the computation to the GPU
  },
});

// hermes.complete(...);
```

### Loading a Model with a Specific Preset

The preset determines the default load configuration and the default inference configuration for a model. By default, the preset associated with the model is used. (Can be changed on the "My Models" page in LM Studio). You can change the preset used by specifying the `preset` option.

```ts
const hermes = await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
  preset: "My ChatML",
});
```

### Custom Loading Progress

You can track the loading progress of a model by providing an `onProgress` callback.

```ts
const hermes = await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
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
  const hermes = await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
    signal: controller.signal,
  });
  // hermes.complete(...);
} catch (error) {
  console.error(error);
}

// Somewhere else in your code:
controller.abort();
```

> [!NOTE}
> **About `AbortController`**
>
> AbortController is a standard JavaScript API that allows you to cancel asynchronous operations. It is supported in modern browsers and Node.js. For more information, see the [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

### Unloading a Model

You can unload a model by calling the `unload` method.

```ts
const hermes = await client.llm.load("NousResearch/Hermes-2-Pro-Mistral-7B-GGUF", {
  identifier: "my-model",
});

// ...Do stuff...

await client.llm.unload("my-model");
```

Note, by default, all models loaded by a client are unloaded when the client disconnects. Therefore, unless you want to precisely control the lifetime of a model, you do not need to unload them manually.

> [!NOTE] > **Keeping a Model Loaded After Disconnection**
>
> If you wish to keep a model loaded after disconnection, you can set the `noHup` option to `true` when loading the model.

### Using an Already Loaded Model

To look up an already loaded model by its identifier, use the following:

```ts
const myModel = client.llm.get({ identifier: "my-model" });
// Or just
const myModel = client.llm.get("my-model");

// myModel.complete(...);
```

To look up an already loaded model by its path, use the following:

```ts
// Matches any quantization
const hermes = client.llm.get({ path: "NousResearch/Hermes-2-Pro-Mistral-7B-GGUF" });

// Or if a specific quantization is desired:
const hermes = client.llm.get({
  path: "NousResearch/Hermes-2-Pro-Mistral-7B-GGUF/Hermes-2-Pro-Mistral-7B.Q4_0.gguf",
});

// hermes.complete(...);
```

> [!NOTE] > **The Underlying Model May Change**
>
> When obtaining a model using `client.llm.get`, you will get an `LLMModel` object. However, the object you get is not tied to a specific loaded model, but a handle for a model that satisfies the given query.
>
> For example, if there is a loaded model with the identifier "my-model", and you call `client.llm.get("my-model")`, you will get an `LLMModel` object that you can use to predict with the model. If the loaded model is later unloaded, the `LLMModel` object still exists, but it no longer refers to a loaded model. Calling prediction methods on it will result in errors. However, if another model is loaded with the same identifier, the `LLMModel` object will now refer to the newly loaded model and can be used again. This allows you to swap out underlying models without restarting your application.
>
> To get the current status of the model, you can use the `model.getModelInfo` method. If it returns undefined, it means there is no loaded model that satisfies the query.
>
> ```ts
> const myModel = client.llm.get("my-model");
> const descriptor = await myModel.getModelInfo();
> if (descriptor === undefined) {
>   console.error("Model not loaded");
> } else {
>   console.info("path:", descriptor.path);
>   console.info("identifier:", descriptor.identifier);
> }
> ```

### Using any Loaded Model

If you do not have a specific model in mind, and just want to use any loaded model, you can simply pass in an empty object to `client.llm.get`.

```ts
const anyModel = client.llm.get({});
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
const firstModel = client.llm.get({ identifier: loadedModels[0].identifier });
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
  config: {
    contextOverflowPolicy: "stopAtLimit",
    maxPredictedTokens: 100,
    prePrompt: "Some pre-prompt",
    stopStrings: ["\n"],
    temperature: 0.7,
  },
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
    config: {
      contextOverflowPolicy: "stopAtLimit",
      maxPredictedTokens: 100,
      stopStrings: ["\n"],
      temperature: 0.7,
      inputPrefix: "Q: ",
      inputSuffix: "\nA:",
    },
  },
);

// ...Do stuff with the prediction...
```

> [!IMPORTANT] \*_Always Provide the Full History/Context_
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

> [!INFO] > **No Extra Waiting**
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
  config: { maxPredictedTokens: 100 },
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

const prediction = hermes.complete("Here is a joke in JSON:", {
  config: { maxPredictedTokens: 100 },
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
