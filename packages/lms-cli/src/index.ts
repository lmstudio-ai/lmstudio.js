import { run, subcommands } from "cmd-ts";
import { server } from "./subcommands/server";
import { printVersion, version } from "./subcommands/version";

if (process.argv.length === 2) {
  printVersion();
  console.info();
  console.info("Usage");
}

const cli = subcommands({
  name: "lms",
  cmds: {
    version,
    server,
  },
});

run(cli, process.argv.slice(2));
