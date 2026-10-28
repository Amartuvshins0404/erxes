const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const trpcCalls = [];
let coreProducts = [];
const filename = path.resolve(__dirname, '../products.ts');
const sourceModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  {
    module: sourceModule,
    exports: sourceModule.exports,
    require: (name) =>
      name === 'erxes-api-shared/utils'
        ? {
            sendTRPCMessage: async (message) => {
              trpcCalls.push(message);
              return coreProducts;
            },
          }
        : {},
  },
  { filename },
);
const { checkRemainders, getDiscount, getRemPlaceEntityId } =
  sourceModule.exports;

const config = {
  token: 'pos',
  isShowRemainder: true,
  placeEntityId: 'store',
  responsibleEntityId: 'sales-team',
  allowPlaceEntityIds: ['warehouse'],
};

test('keys saved remainders by an allowed place other than the POS place', () => {
  assert.equal(getRemPlaceEntityId(config), 'default');
  assert.equal(getRemPlaceEntityId(config, 'store'), 'default');
  assert.equal(getRemPlaceEntityId(config, 'elsewhere'), 'default');
  assert.equal(getRemPlaceEntityId(config, 'warehouse'), 'warehouse');
});

test('counts stock held by the POS place and responsible entity only', async () => {
  coreProducts = [
    {
      _id: 'product',
      inventories: {
        store: {
          'sales-team': { remainder: 4, soonIn: 1, soonOut: 2 },
          'other-team': { remainder: 10 },
        },
        warehouse: { 'sales-team': { remainder: 7 } },
      },
    },
  ];

  const [product] = await checkRemainders('tenant', {}, config, [
    { _id: 'product' },
  ]);

  assert.equal(product.remainder, 4);
  assert.equal(product.soonIn, 1);
  assert.equal(product.soonOut, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(product.remainders)), [
    {
      placeEntityId: 'store',
      responsibleEntityId: 'sales-team',
      count: 4,
      soonIn: 1,
      soonOut: 2,
    },
  ]);
  assert.equal(trpcCalls.at(-1).module, 'products');
});

test('counts stock at a requested allowed place', async () => {
  const [product] = await checkRemainders(
    'tenant',
    {},
    config,
    [{ _id: 'product' }],
    'warehouse',
  );

  assert.equal(product.remainder, 7);
});

test('matches discount rules against the POS place and responsible entity', () => {
  const discounts = [
    {
      discount: 30,
      prefixes: ['branchId'],
      conditions: { branchId: 'warehouse' },
    },
    {
      discount: 20,
      prefixes: ['branchId', 'departmentId'],
      conditions: { branchId: 'store', departmentId: 'sales-team' },
    },
    {
      discount: 50,
      prefixes: ['departmentId'],
      conditions: { departmentId: 'other-team' },
    },
  ];

  assert.equal(getDiscount(discounts, config).discount, 20);
  assert.equal(getDiscount(discounts, config, 'warehouse').discount, 30);
  assert.equal(getDiscount(discounts, config, 'elsewhere').discount, 20);
});
