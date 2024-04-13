import "."; // Import order
import { Event } from "./Event";

test("should trigger in next microtask", async () => {
  const [event, emit] = Event.create<number>();
  const listener = jest.fn();
  event.subscribe(listener);
  emit(1);
  expect(listener).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(listener).toHaveBeenCalledWith(1);
});

test("unsubscribe should work", async () => {
  const [event, emit] = Event.create<number>();
  const listener = jest.fn();
  const unsubscribe = event.subscribe(listener);
  emit(1);
  unsubscribe();
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();
});

test("multiple subscribers should be called in order", async () => {
  const [event, emit] = Event.create<number>();
  const arr: Array<number> = [];
  const listener1 = () => arr.push(1);
  const listener2 = () => arr.push(2);
  event.subscribe(listener1);
  event.subscribe(listener2);
  emit(1);
  await Promise.resolve();
  expect(arr).toEqual([1, 2]);
});

test("events should not buffer", async () => {
  const [event, emit] = Event.create<number>();
  const listener = jest.fn();
  emit(1);
  await Promise.resolve();
  event.subscribe(listener);
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();
});

test("events emitted in subscribe should be emitted in next microtask", async () => {
  const [event, emit] = Event.create<number>();
  let first = true;
  const listener = jest.fn(() => {
    if (first) {
      emit(2);
      first = false;
    }
  });
  event.subscribe(listener);
  emit(1);
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(1);
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(2);
  expect(listener).toHaveBeenCalledWith(2);
});
