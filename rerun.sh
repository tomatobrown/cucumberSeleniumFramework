#!/bin/bash

# Collect failed, nonmuted scenarios and rerun them.
# Place output in a `reports/rerun` directory.
# Exit with the result of the last run.

original_directory="${CUCUMBER_PARALLEL_REPORT_DIR:-reports}"
rerun_directory="$original_directory/rerun"
failed_scenarios="$original_directory/failed"

node bin/checkMuted.js >"$failed_scenarios"
code=$?
if [[ $code != 0 ]]; then
	export CUCUMBER_PARALLEL_REPORT_DIR="$rerun_directory"
	<"$failed_scenarios" xargs ./node_modules/.bin/cuke-skywalker --exit
	./node_modules/.bin/cuke-skywalker-report
	node bin/checkMuted.js >/dev/null
	code=$?
fi

exit $code
