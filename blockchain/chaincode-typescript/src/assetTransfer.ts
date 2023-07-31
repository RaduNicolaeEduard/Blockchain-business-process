/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Asset} from './asset';
enum DocumentStatus {
    Completed = "Completed",
    Cancelled = "Cancelled",
  }
@Info({title: 'AssetTransfer', description: 'Smart contract for trading assets'})
export class AssetTransferContract extends Contract {

    @Transaction()
    public async CreateAsset(ctx: Context, id: string, owner: string, docHash: string, path_on_disk: string, timestamp:string,title:string,description:string,comment:string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }
        let signatories = {
            signatory: owner,
            timestamp: timestamp,
            sha256: docHash,
            path_on_disk: path_on_disk,
            version: 1,
            status: DocumentStatus.Completed,
            comment: comment,
        }
        const asset = {
            ID: id,
            owner: owner,
            signatories: [signatories],
            timestamp: timestamp,
            title: title,
            description: description,
        };
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    }
    @Transaction()
    public async changeStatus(ctx: Context, id: string, signatory: string, status: string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const asset = JSON.parse(assetJSON.toString()) as Asset;
        for(let i = 0; i < asset.signatories.length; i++) {
            if(asset.signatories[i].signatory === signatory) {
                asset.signatories[i].status = DocumentStatus[status];
                return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
            }
        }
        throw new Error(`The signatory ${signatory} does not exist`);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // sign asset
    @Transaction()
    public async SignAsset(ctx: Context, id: string, signatory: string,sha256: string,path_on_disk: string, timestamp: string,comment:string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
    
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const asset = JSON.parse(assetJSON.toString()) as Asset;
        const version = asset.signatories.length + 1;
        const Object = {
            timestamp: timestamp,
            signatory: signatory,
            sha256: sha256,
            path_on_disk: path_on_disk,
            version: version,
            status: DocumentStatus.Completed,
            comment: comment,
        }
        for(let i = 0; i < asset.signatories.length; i++) {
            if(asset.signatories[i].signatory === signatory) {
                throw new Error(`The signatory ${signatory} already signed the asset ${id}`);
            }
        }
        asset.signatories.push(Object);
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    @Returns('string')
    public async GetMyContracts(ctx: Context, owner: string): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if(record.owner === owner) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    // GetAllAssets returns all assets found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}
