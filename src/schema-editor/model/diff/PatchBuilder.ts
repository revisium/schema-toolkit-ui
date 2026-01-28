import type { SchemaTree } from '../tree/SchemaTree';
import type { NodePathIndex } from './index/NodePathIndex';
import type { SchemaPatch } from './SchemaPatch';
import { ChangeCollector } from './changes/ChangeCollector';
import { ChangeCoalescer } from './changes/ChangeCoalescer';
import { PatchGenerator } from './changes/PatchGenerator';
import { FormulaChangeDetector } from './changes/FormulaChangeDetector';
import { PatchEnricher } from './enricher/PatchEnricher';

export class PatchBuilder {
  private readonly collector: ChangeCollector;
  private readonly coalescer: ChangeCoalescer;
  private readonly generator: PatchGenerator;
  private readonly formulaDetector: FormulaChangeDetector;
  private readonly enricher: PatchEnricher;

  constructor(
    currentTree: SchemaTree,
    baseTree: SchemaTree,
    baseIndex: NodePathIndex,
  ) {
    this.collector = new ChangeCollector(currentTree, baseTree, baseIndex);
    this.coalescer = new ChangeCoalescer(currentTree, baseTree, baseIndex);
    this.generator = new PatchGenerator(currentTree, baseTree, baseIndex);
    this.formulaDetector = new FormulaChangeDetector(currentTree, baseTree);
    this.enricher = new PatchEnricher(currentTree, baseTree);
  }

  public build(): SchemaPatch[] {
    const rawChanges = this.collector.collect();
    const coalesced = this.coalescer.coalesce(rawChanges);
    const jsonPatches = this.generator.generate(coalesced);
    const formulaPatches =
      this.formulaDetector.detectIndirectFormulaChanges(jsonPatches);
    const allPatches = [...jsonPatches, ...formulaPatches];
    return allPatches.map((patch) => this.enricher.enrich(patch));
  }
}
