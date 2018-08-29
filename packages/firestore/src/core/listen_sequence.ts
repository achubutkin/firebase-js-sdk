/**
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ListenSequenceNumber } from './types';

/**
 * `SequenceNumberSyncer` defines the methods required to keep multiple instances of a `ListenSequence` in sync.
 */
export interface SequenceNumberSyncer {
  updateSequenceNumber(sequenceNumber: ListenSequenceNumber): void;
  sequenceNumberHandler: ((sequenceNumber: ListenSequenceNumber) => void) | null;
}

/**
 * `ListenSequence` is a monotonic sequence. It is initialized with a minimum value to
 * exceed. All subsequent calls to next will return increasing values. If provided with a
 * `SequenceNumberSyncer`, it will additionally bump its next value when told of a new value, as well as write out
 * sequence numbers that it produces via `next()`.
 */
export class ListenSequence {
  static readonly INVALID: ListenSequenceNumber = -1;

  private writeNewSequenceNumber?: (
    newSequenceNumber: ListenSequenceNumber
  ) => void;

  constructor(
    private previousValue: ListenSequenceNumber,
    sequenceNumberSyncer?: SequenceNumberSyncer
  ) {
    if (sequenceNumberSyncer) {
      sequenceNumberSyncer.sequenceNumberHandler = sequenceNumber => this.setPreviousValue(sequenceNumber);
      this.writeNewSequenceNumber = sequenceNumber =>
        sequenceNumberSyncer.updateSequenceNumber(sequenceNumber);
    }
  }

  private setPreviousValue(
    externalPreviousValue: ListenSequenceNumber
  ): ListenSequenceNumber {
    this.previousValue = Math.max(externalPreviousValue, this.previousValue);
    return this.previousValue;
  }

  next(): ListenSequenceNumber {
    const nextValue = ++this.previousValue;
    if (this.writeNewSequenceNumber) {
      this.writeNewSequenceNumber(nextValue);
    }
    return nextValue;
  }
}
