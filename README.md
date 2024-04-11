# LibGaf

## Installation:
```bash
npm i @takingdoms/lib-gaf
```

## Usage
```ts
import LibGaf from '@takingdoms/lib-gaf';
import fs from 'fs';

// Reading:

const fileData = fs.readFileSync('file.gaf');
const { gaf } = LibGaf.Reader.readFromBuffer(fileData);

// Writing:

const fileData = LibGaf.Writer.writeToBuffer(gaf);
```
