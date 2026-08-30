export interface LanguageTemplate {
  id: string;
  name: string;
  boilerplate: string;
}

export const LANGUAGE_TEMPLATES: LanguageTemplate[] = [
  {
    id: "python",
    name: "Python 3",
    boilerplate: `import sys

def solve():
    # Read standard input
    # input_data = sys.stdin.read().strip()
    # Write your logic here
    pass

if __name__ == "__main__":
    solve()
`
  },
  {
    id: "javascript",
    name: "JavaScript (Node.js)",
    boilerplate: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    // Write your logic here
    // console.log(result);
}

solve();
`
  },
  {
    id: "cpp",
    name: "C++",
    boilerplate: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your logic here
    
    return 0;
}
`
  },
  {
    id: "c",
    name: "C",
    boilerplate: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your logic here
    
    return 0;
}
`
  },
  {
    id: "java",
    name: "Java",
    boilerplate: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // StringTokenizer st = new StringTokenizer(br.readLine());
        // Write your logic here
    }
}
`
  }
];

// Generates and downloads student progress report in CSV format
export function downloadCSV(students: any[]) {
  const headers = ["Rank", "Name", "JNTU No.", "Branch", "Section", "Status", "Violations", "Problems Solved", "Time Taken (Sec)", "Test Submitted"];
  
  // Sort students by problems solved (desc) then time taken (asc)
  const sorted = [...students].sort((a, b) => {
    if (b.problemsSolved !== a.problemsSolved) {
      return b.problemsSolved - a.problemsSolved;
    }
    return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
  });

  const rows = sorted.map((s, idx) => [
    idx + 1,
    s.name,
    s.jntuNo,
    s.branch,
    s.section,
    s.status,
    s.violations,
    s.problemsSolved,
    s.timeTakenSeconds || 0,
    s.submitted ? "Yes" : "No"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `student_progress_report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
