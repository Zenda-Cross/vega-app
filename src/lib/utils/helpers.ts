export const formatName = (name: string): string => {
  // Replace special characters with an underscore
  return name.replaceAll(/[^a-zA-Z0-9]/g, '_');
};
