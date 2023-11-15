#! /bin/sh

# set permissions and service registration
PERMISSIONS=$(echo '
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
' | tr '\n' 'č' | sed -E "s/(\"|\/)/\\\\\1/g");
SERVICES=$(echo '
        <service
            android:name=".JJPluginSMSService"
            android:enabled="true"
            android:exported="true"
        >
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
            </intent-filter>
        </service>
' | tr '\n' 'č' | sed -E "s/(\"|\/)/\\\\\1/g");
file='./app/src/main/AndroidManifest.xml';
if [ -e $file ]; then
	if ! grep -q JJPluginSMSService "$file"; then
	    mv $file $file'_';
	    cat $file'_' \
		    | tr '\n' '\r' \
	        | sed -E "s/(<application[^>]*)\/>/${PERMISSIONS}\n    \1\n    >${SERVICES}\n    <\/application>/" \
	        | tr 'č' '\n' \
	        | tr '\r' '\n' \
	        | dd status=none of=$file
	    rm $file'_'
	    echo '- set permissions and service registration'
	fi;
else echo "ERROR: ${file} not exists!!"
fi;


# installing library for permissions confirmation
DEPENDENCIES=$(echo '
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'io.github.nishkarsh:android-permissions:2.1.6'
' | tr '\n' 'č' | sed -E "s/(\"|\/)/\\\\\1/g");
file='./app/build.gradle';
if [ -e $file ]; then
	if ! grep -q nishkarsh "$file"; then
	    mv $file $file'_';
	    cat $file'_' \
		    | tr '\n' '\r' \
	        | sed -E "s/(dependencies \{)/\1${DEPENDENCIES}/" \
	        | tr 'č' '\n' \
	        | tr '\r' '\n' \
	        | dd status=none of=$file
	    rm $file'_'
	    echo '- installing library for permissions confirmation'
	fi;
else echo "ERROR: ${file} not exists!!"
fi;


# disable run activity
file='./.idea/workspace.xml';
if [ -e $file ]; then
	if grep -q default_activity "$file"; then
	    mv $file $file'_';
	    cat $file'_' \
		    | tr '\n' '\r' \
	        | sed -E "s/(<option name=\"MODE\" value=\")[^\"]+/\1do_nothing/" \
	        | tr 'č' '\n' \
	        | tr '\r' '\n' \
	        | dd status=none of=$file
	    rm $file'_'
	    echo '- disable run activity'
	fi;
else echo "ERROR: ${file} not exists!!"
fi;


echo DONE;
