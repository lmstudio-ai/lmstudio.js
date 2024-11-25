import "."; // Import order
import { BufferedEvent } from "./BufferedEvent.js";

test("should trigger in next microtask", async () => {
  const [event, emit] = BufferedEvent.create<number>();
  const listener = jest.fn();
  event.subscribe(listener);
  emit(1);
  expect(listener).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(1);
});

test("unsubscribe should work", async () => {
  const [event, emit] = BufferedEvent.create<number>();
  const listener = jest.fn();
  const unsubscribe = event.subscribe(listener);
  emit(1);
  unsubscribe();
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();
});

test("multiple subscribers should throw", async () => {
  const [event] = BufferedEvent.create<number>();
  const listener1 = jest.fn();
  const listener2 = jest.fn();
  event.subscribe(listener1);
  expect(() => event.subscribe(listener2)).toThrow();
});

test("events should buffer", async () => {
  const [event, emit] = BufferedEvent.create<number>();
  const listener = jest.fn();
  emit(1);
  await Promise.resolve();
  event.subscribe(listener);
  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(1);
});

test("events should buffer multiple", async () => {
  const [event, emit] = BufferedEvent.create<number>();
  const listener = jest.fn();
  emit(1);
  emit(2);
  await Promise.resolve();
  event.subscribe(listener);
  await Promise.resolve();
  expect(listener.mock.calls).toEqual([[1], [2]]);
});

test("buffered event should not be lost if unsubscribes during emit", async () => {
  const [event, emit] = BufferedEvent.create<number>();
  const firstListenerCalls: Array<number> = [];
  const unsubscribe = event.subscribe(data => {
    firstListenerCalls.push(data);
    unsubscribe();
  });
  emit(1);
  emit(2);
  await Promise.resolve();
  expect(firstListenerCalls).toEqual([1]);
  const listener2 = jest.fn();
  event.subscribe(listener2);
  await Promise.resolve();
  expect(listener2).toHaveBeenCalledTimes(1);
  expect(listener2).toHaveBeenCalledWith(2);
});
