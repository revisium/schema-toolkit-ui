import * as mobx from 'mobx';
import {
  setReactivityProvider,
  createMobxProvider,
} from '@revisium/schema-toolkit/core';

let initialized = false;

export function ensureReactivityProvider(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  setReactivityProvider(createMobxProvider(mobx));
}
