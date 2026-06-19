import { describe, it, expect } from 'vitest';
import * as bridgeWellsModule from '../../../bridge/wells.js';
import { WELLS, THRESHOLDS } from './wells.js';

// bridge/wells.js is CommonJS; normalize the interop shape.
const bridgeWells = bridgeWellsModule.default ?? bridgeWellsModule;

describe('web/app/lib/wells.js parity with bridge/wells.js', () => {
  it('keeps WELLS in sync between the two manually-maintained copies', () => {
    expect(WELLS).toEqual(bridgeWells.WELLS);
  });

  it('keeps THRESHOLDS in sync between the two manually-maintained copies', () => {
    expect(THRESHOLDS).toEqual(bridgeWells.THRESHOLDS);
  });
});
