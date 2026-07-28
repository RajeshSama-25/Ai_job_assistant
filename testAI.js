import { matchJob } from "./Services/aiService.js";

async function test() {
  const result = await matchJob({
    title: "Node.js Developer",
    company: "Test Co",
    description: "Need a Node.js developer with React experience.",
  });

  console.log(result);
}

test();