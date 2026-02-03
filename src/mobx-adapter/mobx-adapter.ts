import {
  makeObservable,
  observable,
  computed,
  action,
  reaction,
  runInAction,
} from 'mobx';
import type {
  ReactivityAdapter,
  AnnotationsMap,
  AnnotationType,
} from '@revisium/schema-toolkit/core';

type MobxAnnotation =
  | typeof observable
  | typeof observable.ref
  | typeof computed
  | typeof action;

const ANNOTATION_MAP: Record<AnnotationType, MobxAnnotation> = {
  observable: observable,
  'observable.ref': observable.ref,
  computed: computed,
  action: action,
};

function convertAnnotations<T extends object>(
  annotations: AnnotationsMap<T>,
): Record<string, MobxAnnotation> {
  const result: Record<string, MobxAnnotation> = {};

  for (const key in annotations) {
    const annotationType = annotations[key as keyof T];
    if (annotationType !== undefined) {
      result[key] = ANNOTATION_MAP[annotationType];
    }
  }

  return result;
}

class MobxReactivityAdapter implements ReactivityAdapter {
  makeObservable<T extends object>(
    target: T,
    annotations: AnnotationsMap<T>,
  ): void {
    const mobxAnnotations = convertAnnotations(annotations);
    makeObservable(target, mobxAnnotations);
  }

  observableArray<T>(): T[] {
    return observable.array<T>([]);
  }

  observableMap<K, V>(): Map<K, V> {
    return observable.map<K, V>();
  }

  reaction<T>(expression: () => T, effect: (value: T) => void): () => void {
    return reaction(expression, effect);
  }

  runInAction<T>(fn: () => T): T {
    return runInAction(fn);
  }
}

export const mobxAdapter: ReactivityAdapter = new MobxReactivityAdapter();
