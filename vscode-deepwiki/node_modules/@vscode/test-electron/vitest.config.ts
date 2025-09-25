/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['lib/**/*.test.{ts,mts}'],
		testTimeout: 120_000,
		hookTimeout: 30_000,
		retry: 3,
	},
});
