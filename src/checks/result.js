/** Uniform shape for every acceptance check. `failures` empty means pass. */
export function result(id, title, failures, details = []) {
  return { id, title, pass: failures.length === 0, failures, details };
}
