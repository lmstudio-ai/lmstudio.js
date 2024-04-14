# `create-react-app` + `lmstudio.js` example

## Introduction

This example demonstrates how to use the LM Studio TypeScript SDK in a React application created with `create-react-app`.

It was created by running `npx create-react-app my-lms-app --template typescript` and then adding the LM Studio SDK to it by running `npm install @lmstudio/sdk`.

Use it as a reference implementation or as a starting point for your own project.

Visit the LM Studio SDK documentation at [https://lmstudio.ai/docs/](https://lmstudio.ai/docs/) for more information.

## 1. Prerequisites

1. If you don't have it installed already, get LM Studio from [https://lmstudio.ai/mit-hackathon](https://lmstudio.ai/mit-hackathon)

2. Set up your LM Studio dev tools (the `lms` cli):
    ### macOS / Linux
    - #### Zsh (Oh My Zsh)
      ```bash
      echo 'export PATH="$HOME/.cache/lm-studio/bin:$PATH"' >> ~/.zshrc
      ```

    - #### Bash
      ```bash
      echo 'export PATH="$HOME/.cache/lm-studio/bin:$PATH"' >> ~/.bashrc
      ```
    > *Not sure which shell you're using? Pop open your terminal and run `echo $SHELL` to find out. `/bin/zsh` means you're using Zsh, `/bin/bash` means you're using Bash.*

      #### 👉 Test that you have it all working by running `lms` in your terminal. 

    ### Windows
    - `lms.exe` should already be in your PATH after installation. Test it by running `lms.exe` in powershell or cmd.


## 2. Download local LLMs
To use this example, you will need to have at least one LLM downloaded locally. You can download LLMs from the LM Studio app.
Check the featured models in the app's home page, or browse LM Studio's Hugging Face page: https://huggingface.co/lmstudio-community.

## 3. Start a dev LLM server on `localhost`

Run this command in your terminal:

```bash
lms server start --cors
```

Expect to see the following output:

```console
W  CORS is enabled. This means any website you visit can use the LM Studio server.
I  Attempting to start the server on port 1234...
I  Requested the server to be started on port 1234.
I  Verifying the server is running...
I  Verification succeeded. The server is running on port 1234.
```

To use a different port, pass the `--port PORT` option.

## 4. Hack with React + lmstudio.js

1. Clone this repository

2. Install dependencies

```bash
  npm install
```

3. Start the development server

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser
