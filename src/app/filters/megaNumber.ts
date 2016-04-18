// from https://gist.github.com/timgit/7bc5896f5297301afb02

export function megaNumber() {
    return (n: number, fractionSize: number): string => {
        if (n === null) {
            return null;
        }
        if (n === 0) {
            return '0';
        }

        if (!fractionSize || fractionSize < 0) {
            fractionSize = 1;
        }

        var abs: number = Math.abs(n);
        var rounder: number = Math.pow(10, fractionSize);
        var isNegative: boolean = n < 0;
        var key: string = '';
        var powers: any[] = [
            {key: 'Q', value: Math.pow(10, 15)},
            {key: 'T', value: Math.pow(10, 12)},
            {key: 'B', value: Math.pow(10, 9)},
            {key: 'M', value: Math.pow(10, 6)},
            {key: 'K', value: 1000}
        ];

        for (var i = 0; i < powers.length; i++) {
            var reduced: number = abs / powers[i].value;

            reduced = Math.round(reduced * rounder) / rounder;

            if (reduced >= 1) {
                abs = reduced;
                key = powers[i].key;
                break;
            }
        }

        return (isNegative ? '-' : '') + abs + key;
    };
};
