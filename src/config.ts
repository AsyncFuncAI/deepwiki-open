export const config = {
  landingPage: {
    advancedOptions: {
      /*
      position: modal | embed
      */
      position: 'modal'
    }
  },
  wikiPage: {
    askSection: {
      /*
      enabled: true | false
      */
      enabled: true,
      /* 
      position: bottom | top | embed
      */
      position: 'bottom',
      /*
      collapsible: true | false
      */
      collapsible: true,
      /*
      defaultState: open | closed
      */
      defaultState: 'open',
    },
    exportWiki:{
      /*
      markdown: true | false
      */
      markdown: true,
      /*
      json: true | false
      */
      json: true
    },
    wikiContent: {
      sizes: {
        /*
          Sizes for the markdown content using tailwindcss classes (https://tailwindcss.com/docs/font-size#using-a-custom-value)
          Default sizes are:
          p: 'xs',
          h1: 'base',
          h2: 'sm',
          h3: 'sm',
          h4: 'xs',
          ul: 'xs',
          ol: 'xs',
          li: 'xs',
          a: 'xs',
          blockquote: 'xs',
          table: 'xs',
          codeBlock: 'xs',
          codeInline: 'xs'
        */
        p: 'xs',
        h1: 'base',
        h2: 'sm',
        h3: 'sm',
        h4: 'xs',
        ul: 'xs',
        ol: 'xs',
        li: 'xs',
        a: 'xs',
        blockquote: 'xs',
        table: 'xs',
        codeBlock: 'xs',
        codeInline: 'xs'
      }
    }
  }
}

export const getConfig = (path: string) => {
  const keys = path.split('.');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: {[key: string]: any} = config;
  for (const key of keys) {
    result = result[key];
  }
  return result;
}
