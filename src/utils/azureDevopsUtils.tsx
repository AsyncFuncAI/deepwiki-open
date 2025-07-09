export async function fetchAzureDevOpsFileTree({
  repoUrl,
  accessToken,
  repositoryPath = '',
}: {
  repoUrl: string;
  accessToken: string;
  repositoryPath?: string;
}): Promise<{ fileTreeData: string; readmeContent: string }> {
  // Example repoUrl: https://dev.azure.com/org/project/_git/repo
  const urlMatch = repoUrl.match(/^https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/);
  if (!urlMatch) {
    throw new Error('Invalid Azure DevOps repository URL');
  }
  const [_, organization, project, repository] = urlMatch;

  // Build API URL
  let apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?recursionLevel=Full&api-version=7.0`;
if (repositoryPath !== null && repositoryPath !== undefined) {
    apiUrl += `&scopePath=/${encodeURIComponent(repositoryPath)}`;
  }

  // Azure DevOps uses Basic Auth with PAT as username (empty) and password (the token)
  const authHeader = 'Basic ' + btoa(':' + accessToken);

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Azure DevOps API error (${response.status}): ${errorData}`);
  }

  const data = await response.json();

  // data.value is an array of items (files and folders)
  const fileTreeData = data.value
    .filter((item: { gitObjectType: string }) => item.gitObjectType === 'blob')
    .map((item: { path: string }) => item.path.replace(/^\//, ''))
    .join('\n');

  // Try to fetch README.md content
  let readmeContent = '';
  const readmeItem = data.value.find((item: { path: string }) => /README\.md$/i.test(item.path));
  if (readmeItem) {
    const readmeUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${encodeURIComponent(readmeItem.path)}&api-version=7.0&$format=text`;
    const readmeRes = await fetch(readmeUrl, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });
    if (readmeRes.ok) {
      readmeContent = await readmeRes.text();
    }
  }

  return { fileTreeData, readmeContent };
}