import {
  getCurrentStack,
  SimpleLogger,
  type LoggerInterface,
  type Validator,
} from "@lmstudio/lms-common";
import { type RepositoryPort } from "@lmstudio/lms-external-backend-interfaces";
import { modelSearchOptsSchema, type ModelSearchOpts } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { ModelSearchResultEntry } from "./ModelSearchResultEntry.js";

/** @public */
export class RepositoryNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly validator: Validator,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("Repository", parentLogger);
  }

  public async searchModels(opts: ModelSearchOpts): Promise<Array<ModelSearchResultEntry>> {
    const stack = getCurrentStack(1);
    opts = this.validator.validateMethodParamOrThrow(
      "repository",
      "search",
      "opts",
      modelSearchOptsSchema,
      opts,
      stack,
    );
    const { results } = await this.repositoryPort.callRpc("searchModels", { opts }, { stack });
    return results.map(
      data => new ModelSearchResultEntry(this.repositoryPort, this.validator, this.logger, data),
    );
  }

  public async push(path: string): Promise<void> {
    const stack = getCurrentStack(1);
    path = this.validator.validateMethodParamOrThrow(
      "repository",
      "push",
      "path",
      z.string(),
      path,
      stack,
    );
    await this.repositoryPort.callRpc("push", { path }, { stack });
  }
}
