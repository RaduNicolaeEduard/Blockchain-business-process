import { Contract, Context } from 'fabric-contract-api';

class Document {
    constructor(
        public docType: string,
        public owner: string,
        public signatories: string[],
        public docHash: string
    ) {}

    // You can add methods to this class if needed
}

class DocumentContract extends Contract {

    public async createDocument(ctx: Context, id: string, owner: string, hash: string): Promise<void> {
        const document = new Document('document', owner, [], hash);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(document)));
    }

    public async signDocument(ctx: Context, id: string, signatory: string): Promise<void> {
        const documentData = await ctx.stub.getState(id);
        if (!documentData || documentData.length === 0) {
            throw new Error(`The document ${id} does not exist`);
        }
        const document = JSON.parse(documentData.toString()) as Document;
        document.signatories.push(signatory);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(document)));
    }
}