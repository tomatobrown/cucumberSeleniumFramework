const fs = require('fs');
const path = require('path');

(function () {
    const reportDir = path.join(__dirname, '../reports/');
    const filenames = fs.readdirSync(reportDir);
    for (let i = 0; i < filenames.length; i += 1) {
        if (filenames[i].indexOf('.json') > -1) {
            try {
                const content = fs.readFileSync(reportDir + filenames[i], 'utf-8');
                JSON.parse(content);
            // eslint-disable-next-line no-empty
            } catch (ex) {
                fs.unlinkSync(reportDir + filenames[i]);
            }
        }
    }
})();