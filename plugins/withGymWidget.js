const { withAndroidManifest, withProjectBuildGradle, withAppBuildGradle, WarningAggregator } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_PROVIDER_CLASS = '.GymWidgetProvider';

function copyWidgetResources(projectRoot) {
  const srcDir = path.join(projectRoot, 'assets', 'widget-layout');
  const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

  const layouts = [
    { src: 'gym_widget_layout.xml', dst: path.join(resDir, 'layout', 'gym_widget_layout.xml') },
  ];
  const xmlFiles = [
    { src: 'gym_widget_info.xml', dst: path.join(resDir, 'xml', 'gym_widget_info.xml') },
  ];

  for (const f of layouts) {
    const srcPath = path.join(srcDir, f.src);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(f.dst), { recursive: true });
      fs.copyFileSync(srcPath, f.dst);
    }
  }

  for (const f of xmlFiles) {
    const srcPath = path.join(srcDir, f.src);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(f.dst), { recursive: true });
      fs.copyFileSync(srcPath, f.dst);
    }
  }
}

function addWidgetProviderToManifest(androidManifest) {
  const { manifest } = androidManifest;
  if (!Array.isArray(manifest.application)) return androidManifest;

  for (const app of manifest.application) {
    if (!Array.isArray(app['receiver'])) {
      app['receiver'] = [];
    }

    const hasWidget = app['receiver'].some(
      (r) => r.$?.['android:name'] === WIDGET_PROVIDER_CLASS
    );
    if (hasWidget) continue;

    app['receiver'].push({
      $: {
        'android:name': WIDGET_PROVIDER_CLASS,
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/gym_widget_info',
          },
        },
      ],
    });
  }

  return androidManifest;
}

function createWidgetProviderClass(projectRoot) {
  const pkg = 'com.francisco.exercisesgym';
  const dir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', ...pkg.split('.'));
  const filePath = path.join(dir, 'GymWidgetProvider.kt');

  if (fs.existsSync(filePath)) return;

  fs.mkdirSync(dir, { recursive: true });

  const content = `package ${pkg}

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class GymWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.gym_widget_layout)

        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
`;
  fs.writeFileSync(filePath, content);
}

function withGymWidget(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addWidgetProviderToManifest(config.modResults);
    return config;
  });

  return config;
}

module.exports = function withGymWidgetPlugin(config) {
  try {
    const root = config.modRequest?.projectRoot || process.cwd();
    copyWidgetResources(root);
    createWidgetProviderClass(root);
  } catch (e) {
    console.warn('[withGymWidget] Failed to set up widget resources:', e.message);
  }
  return withGymWidget(config);
};
