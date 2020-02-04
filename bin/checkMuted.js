#!/usr/bin/env node

/* eslint-disable no-console */
const path = require('path');

const REPORT_DIR = process.env.CUCUMBER_PARALLEL_REPORT_DIR || 'reports';
const MUTE_TAGS = process.env.MUTE_TAGS || '';

console.error('Mute tags:', MUTE_TAGS);

const muteTagArray = MUTE_TAGS.match(/(@mute\S*|@quarantine\S*)/g) || [];
const muteTags = new Set(muteTagArray);

const combined = require(path.resolve(REPORT_DIR, 'combined.json'));
const failedScenarios = [];
for (const feature of combined) {
	if (isMuted(feature.tags)) {
		continue;
	}
	for (const scenario of feature.elements) {
		if (isMuted(scenario.tags)) {
			continue;
		}
		if (scenario.steps.some(s => s.result.status === 'failed')) {
			failedScenarios.push({
				name: scenario.name,
				location: `${feature.uri}:${scenario.line}`,
			});
		}
	}
}

if (failedScenarios.length > 0) {
	console.error('Failed scenarios that are not muted:');
	for (const scenario of failedScenarios) {
		console.error(` - ${scenario.location}`);
		console.log(scenario.location); // stdout for piping
	}
	process.exit(1);
}

function isMuted(tags) {
	return tags.some(t => muteTags.has(t.name));
}
