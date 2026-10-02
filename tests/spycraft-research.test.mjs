import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const workflow=readFileSync(path.join(root,".github/workflows/spycraft-ghidra.yml"),"utf8");
const inventory=readFileSync(path.join(root,"tools/spycraft/inventory.py"),"utf8");
const report=readFileSync(path.join(root,"tools/spycraft/build_report.py"),"utf8");
const ghidra=readFileSync(path.join(root,"tools/ghidra_scripts/SpycraftReport.java"),"utf8");
const research=readFileSync(path.join(root,"docs/spycraft-research.md"),"utf8");

test("Spycraft workflow pins and hash-gates its two downloaded inputs",()=>{
  for(const value of [
    "2_410_498",
    "6eb0f915fb10123eb89575ac46132357",
    "cd1ab69040bcdce7e4131e62216fd65ac8361b22",
  ]) assert.ok(inventory.includes(value),`missing demo gate ${value}`);
  assert.match(workflow,/GHIDRA_VERSION: '12\.1\.4'/);
  assert.match(workflow,/ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db/);
  assert.match(workflow,/sha256sum --check --strict/);
  assert.doesNotMatch(workflow,/--skip-archive-gate/);
});

test("Spycraft acquisition and analysis remain static-only",()=>{
  assert.match(workflow,/analyzeHeadless/);
  assert.match(workflow,/-postScript SpycraftReport\.java/);
  assert.match(workflow,/Remove copyrighted inputs before artifact upload/);
  assert.match(workflow,/rm -rf "\$RUNNER_TEMP\/spycraft\/extracted"/);
  assert.match(workflow,/find "\$evidence" -type f -name '\*\.asm' -delete/);
  assert.match(ghidra,/Static analysis only/);
  assert.match(report,/static-only; binaries were imported but never executed/);
  assert.match(research,/No installer, game executable, DLL, script, or media member is launched/);
});

test("inventory rejects traversal, absolute paths, and drive-qualified members",()=>{
  const script=String.raw`
import importlib.util, pathlib, sys
spec=importlib.util.spec_from_file_location("spycraft_inventory", pathlib.Path(sys.argv[1]))
module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
for value in ("../escape.exe", "/absolute.exe", "C:/drive.exe", "dir/../../escape.exe"):
    try: module.safe_member_path(value)
    except ValueError: pass
    else: raise SystemExit("accepted unsafe path: " + value)
assert str(module.safe_member_path("DEMO/SPYCRAFT.EXE")) == "DEMO/SPYCRAFT.EXE"
`;
  execFileSync("python3",["-c",script,path.join(root,"tools/spycraft/inventory.py")],{stdio:"pipe"});
});

test("copyrighted Spycraft inputs are absent from the repository",()=>{
  const forbidden=[];
  const walk=directory=>{
    for(const entry of readdirSync(directory,{withFileTypes:true})){
      if(entry.name===".git"||entry.name==="node_modules") continue;
      const target=path.join(directory,entry.name);
      if(entry.isDirectory()) walk(target);
      else if(/(?:spycraft\.zip|spycraft\.exe|dukdll95\.dll|sos9503\.dll)$/i.test(entry.name)) forbidden.push(path.relative(root,target));
    }
  };
  walk(root);
  assert.deepEqual(forbidden,[]);
  for(const file of [
    ".github/workflows/spycraft-ghidra.yml",
    "tools/spycraft/inventory.py",
    "tools/spycraft/build_report.py",
    "tools/ghidra_scripts/SpycraftReport.java",
    "docs/spycraft-research.md",
  ]) assert.ok(existsSync(path.join(root,file)),`missing ${file}`);
});
