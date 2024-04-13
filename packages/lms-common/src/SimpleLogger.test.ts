import { SimpleLogger, type LoggerInterface } from "./SimpleLogger";

describe.skip("SimpleLogger", () => {
  let mockLogger: LoggerInterface;
  let simpleLogger: SimpleLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
    simpleLogger = new SimpleLogger("test", mockLogger);
  });

  it("should log info correctly", () => {
    simpleLogger.info("info message");
    expect(mockLogger.info).toHaveBeenCalledWith("[test]", "info message");
  });

  it("should log error correctly", () => {
    simpleLogger.error("error message");
    expect(mockLogger.error).toHaveBeenCalledWith("[test]", "error message");
  });

  it("should log warn correctly", () => {
    simpleLogger.warn("warn message");
    expect(mockLogger.warn).toHaveBeenCalledWith("[test]", "warn message");
  });

  it("should log debug correctly", () => {
    simpleLogger.debug("debug message");
    expect(mockLogger.debug).toHaveBeenCalledWith("[test]", "debug message");
  });

  it("should log at level correctly", () => {
    simpleLogger.logAtLevel("info", "info message");
    expect(mockLogger.info).toHaveBeenCalledWith("[test]", "info message");
  });
});
