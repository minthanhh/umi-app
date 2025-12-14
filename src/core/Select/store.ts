import { Listener } from "./types";

export class SelectStore {
  private config;
  private adapter;
  private values;

  private fieldListeners: Set<Listener> = new Set();

  constructor({ config, adapter, initialValues }) {
    this.config = config;
    this.adapter = adapter;
    this.values = initialValues;
  }

}
