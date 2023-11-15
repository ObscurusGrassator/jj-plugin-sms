For detailed documentation and format helping by types, VSCode IDE is recommended.  

`npm install --save-dev jjplugin`

`npx jjPluginBuild`

**GitLab or GitHub require topic for acces through jjAssistant:** `jjplugin`

**src/index.js:**
```js
module.exports = addPlugin(
    {                                                               // defaultConfig
        serviceName: {
            propertyWithoutValue: { type: 'string' },               // application will request by user
            propertyWithValue: { type: 'boolean', value: false },
        },
    },
    on_which_systems_the_plugin_can_be_installed,
    otherOptionalFuncions,
    {                                                               // insert one of:
        sentenceMemberRequirementStrings: [ "..." ],                //   string schema of sentence
        sentenceMemberRequirements: { _or: [{ ... }, { ... }] },    //   object schema of sentence
    },
    async ctx => { ... },                                           // logic for identificated sentence

    // ... you can repeat last 2 attributes several tymes
);
```

**sentenceMemberRequirementStrings item format** = array of \<sentenceMember\> strings joined of space  
**\<sentenceMember\> format:**
```
?word<alternativeRegExp>
||  | └***************└> (optional) /RegExp/i compared with word base (== without declension)
|└**└------------------> (required) Original declensioned word (or punctuation).
|                                   Equals property will exists in ctx.propName attribute of his function
└----------------------> (optional) Word may or may not exist
```