/**
 * Represents the result of running `llm.act`. Currently only contains minimum amount of
 * information.
 *
 * If you think more information/fields should be added, please open an issue or a PR on GitHub.
 *
 * @public
 */
export class ActResult {
  public constructor(
    /**
     * Number of rounds performed.
     *
     * For example, in the following scenario:
     *
     * - User asks the model to add 1234 and 5678.
     * - The model requests to use a calculator tool.
     * - The calculator tool outputs 6912.
     * - The calculator's output is then fed back to the model for a second round of prediction.
     * - The model sees the output and generates a paragraph explaining the result.
     *
     * There are 2 rounds. On the beginning of a round, the callback `onRoundStart` is triggered.
     * On the end of a round, the callback `onRoundEnd` is triggered.
     */
    public readonly rounds: number,
    /**
     * Total time taken to run `.act` in seconds. measured from beginning of the `.act` invocation
     * to when the entire operation is finished.
     */
    public readonly totalExecutionTimeSeconds: number,
  ) {}
}
