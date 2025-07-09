export const getCacheKey = (
  owner: string,
  repo: string,
  repoType: string,
  language: string,
  isComprehensive: boolean = true,
  repositoryPath: string = ""
): string => {
  if (repositoryPath && repositoryPath !== "null" && repositoryPath.trim() !== "") {
    return `deepwiki_cache_${repoType}_${owner}_${repo}_${repositoryPath}_${language}_${isComprehensive ? 'comprehensive' : 'concise'}`;
  }
  return `deepwiki_cache_${repoType}_${owner}_${repo}_${language}_${isComprehensive ? 'comprehensive' : 'concise'}`;
};