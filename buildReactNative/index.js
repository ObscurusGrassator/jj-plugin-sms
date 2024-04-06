var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _asyncToGenerator2=_interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));var SMS=require('./SMS');function readableNumber(number){return(''+number).split('').reverse().join(' ').replace(/([^ ] [^ ] [^ ])/g,'$1 .').split('').reverse().join('');}module.exports=require("server/types/pluginFunctions.cjs").addPlugin({sms:{automatic:{checkNewMessage:{type:'boolean',value:false}}}},{os:{android:true},pluginFormatVersion:1},{moduleRequirementsFree:[{name:'JJPlugin SMS apk',android:{packageName:'jjplugin.obsgrass.sms',downloadUrl:'https://github.com/ObscurusGrassator/jjplugin-sms/releases/download/1.2.0/JJPluginSMS_v1.2.0.apk'}}],scriptInitializer:function(){var _scriptInitializer=(0,_asyncToGenerator2.default)(function*(ctx){return new SMS(ctx);});function scriptInitializer(_x){return _scriptInitializer.apply(this,arguments);}return scriptInitializer;}()},{scriptPerInterval:function(){var _scriptPerInterval=(0,_asyncToGenerator2.default)(function*(ctx){if(!ctx.config.sms.automatic.checkNewMessage.value)return;var newMessages=yield ctx.methodsForAI.getMessages();var messages=Object.values(newMessages);var newMessagesString=JSON.stringify(newMessages);if(messages&&messages.length&&ctx.methodsForAI.lastMessages!=newMessagesString){ctx.methodsForAI.lastMessages=newMessagesString;if(messages.length>1)return'Prišli nové SMS od '+messages.map(function(a){return a.fullName||/[a-z]/i.test(a.number)&&a.number||'čísla: '+readableNumber(a.number);}).join(', ').replace(/, ([^,]+)$/,' a $1');if(messages.length===1)return'Prišli novú SMS od '+(messages[0].fullName||/[a-z]/i.test(messages[0].number)&&messages[0].number||'čísla: '+readableNumber(messages[0].number));}});function scriptPerInterval(_x2){return _scriptPerInterval.apply(this,arguments);}return scriptPerInterval;}()});