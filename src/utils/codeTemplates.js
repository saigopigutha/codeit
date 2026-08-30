
export const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python 3', ext: 'py', mode: 'python' },
  { id: 'cpp', name: 'C++ (GCC 14)', ext: 'cpp', mode: 'cpp' },
  { id: 'c', name: 'C (GCC 14)', ext: 'c', mode: 'c' },
  { id: 'java', name: 'Java 21 (OpenJDK)', ext: 'java', mode: 'java' },
  { id: 'javascript', name: 'JavaScript (Node.js 20)', ext: 'js', mode: 'javascript' },
];

export const STARTER_TEMPLATES = {
  python: `# Python 3
import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Process inputs and print result to standard output
    # Example:
    # n = int(input_data[0])
    # print(n)

if __name__ == '__main__':
    solve()
`,
  cpp: `// C++ (GCC 14)
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read inputs from cin and print results to cout
    // Example:
    // int n;
    // if (cin >> n) {
    //     cout << n << "\\n";
    // }

    return 0;
}
`,
  c: `// C (GCC 14)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Read inputs from stdin and print results to stdout
    // Example:
    // int n;
    // if (scanf("%d", &n) == 1) {
    //     printf("%d\\n", n);
    // }

    return 0;
}
`,
  java: `// Java 21 (OpenJDK)
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read inputs and print results to System.out
        // Example:
        // if (scanner.hasNextInt()) {
        //     int n = scanner.nextInt();
        //     System.out.println(n);
        // }
    }
}
`,
  javascript: `// JavaScript (Node.js 20)
const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    
    // Read input and print results using console.log()
    // Example:
    // console.log(input);
}

main();
`
};
