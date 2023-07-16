/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

@Object()
export class Asset {

    @Property()
    public docType?: string;

    @Property()
    public ID?: string;

    @Property()
    public owner: string;

    @Property()
    public signatories: Signatory[];

    @Property()
    public sha256: string;

    @Property()
    public timestamp: string;

    @Property()
    public path_on_disk: string;
}

@Object()
export class Signatory {

    @Property()
    public signatory: string;

    @Property()
    public timestamp: string;
}