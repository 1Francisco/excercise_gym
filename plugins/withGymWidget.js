const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const PACKAGE = 'com.francisco.exercisesgym';

const WIDGETS = [
  {
    provider: '.GymWidgetProvider',
    layout: 'gym_widget_layout.xml',
    info: 'gym_widget_info.xml',
  },
  {
    provider: '.ProgressWidgetProvider',
    layout: 'progress_widget_layout.xml',
    info: 'progress_widget_info.xml',
  },
  {
    provider: '.QuickWidgetProvider',
    layout: 'quick_widget_layout.xml',
    info: 'quick_widget_info.xml',
  },
];

function copyResources(projectRoot) {
  const srcDir = path.join(projectRoot, 'assets', 'widget-layout');
  const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

  // Layouts
  for (const w of WIDGETS) {
    const srcPath = path.join(srcDir, w.layout);
    const dstPath = path.join(resDir, 'layout', w.layout);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
    }
  }

  // Info XMLs
  for (const w of WIDGETS) {
    const srcPath = path.join(srcDir, w.info);
    const dstPath = path.join(resDir, 'xml', w.info);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
    }
  }

  // Drawable
  const drawableSrc = path.join(srcDir, 'drawable', 'widget_bg.xml');
  const drawableDst = path.join(resDir, 'drawable', 'widget_bg.xml');
  if (fs.existsSync(drawableSrc)) {
    fs.mkdirSync(path.dirname(drawableDst), { recursive: true });
    fs.copyFileSync(drawableSrc, drawableDst);
  }
}

function registerWidgetProviders(androidManifest) {
  const { manifest } = androidManifest;
  if (!Array.isArray(manifest.application)) return androidManifest;

  for (const app of manifest.application) {
    if (!Array.isArray(app['receiver'])) {
      app['receiver'] = [];
    }

    for (const w of WIDGETS) {
      const hasWidget = app['receiver'].some(
        (r) => r.$?.['android:name'] === w.provider
      );
      if (hasWidget) continue;

      const infoFile = w.info.replace('.xml', '');
      app['receiver'].push({
        $: { 'android:name': w.provider, 'android:exported': 'true' },
        'intent-filter': [
          { action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }] },
        ],
        'meta-data': [
          { $: { 'android:name': 'android.appwidget.provider', 'android:resource': `@xml/${infoFile}` } },
        ],
      });
    }
  }

  return androidManifest;
}

function createKotlinProviders(projectRoot) {
  const dir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', ...PACKAGE.split('.'));
  fs.mkdirSync(dir, { recursive: true });

  const providers = {
    GymWidgetProvider: `package ${PACKAGE}

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews

class GymWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (id in ids) updateAppWidget(context, manager, id)
    }

    private fun updateAppWidget(ctx: Context, manager: AppWidgetManager, id: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.gym_widget_layout)
        val prefs = ctx.getSharedPreferences("gym_widget_data", Context.MODE_PRIVATE)

        val lastDate = prefs.getString("last_date", null)
        val lastVolume = prefs.getString("last_volume", null)
        val streak = prefs.getString("streak", "0")

        if (lastDate != null) {
            views.setTextViewText(R.id.widget_title, "\\uD83D\\uDCAA \\u00daltimo Entreno")
            views.setTextViewText(R.id.widget_subtitle, "$lastDate  |  $lastVolume kg")
            views.setTextViewText(R.id.widget_body, prefs.getString("last_exercises", ""))
        } else {
            views.setTextViewText(R.id.widget_title, "\\uD83C\\uDFCB Exercises Gym")
            views.setTextViewText(R.id.widget_subtitle, "Toca para empezar")
            views.setTextViewText(R.id.widget_body, "")
        }

        views.setTextViewText(R.id.widget_streak_value, streak)

        val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        val pi = PendingIntent.getActivity(ctx, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.widget_container, pi)

        manager.updateAppWidget(id, views)
    }
}
`,

    ProgressWidgetProvider: `package ${PACKAGE}

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews

class ProgressWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (id in ids) updateAppWidget(context, manager, id)
    }

    private fun updateAppWidget(ctx: Context, manager: AppWidgetManager, id: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.progress_widget_layout)
        val prefs = ctx.getSharedPreferences("gym_widget_data", Context.MODE_PRIVATE)

        views.setTextViewText(R.id.progress_streak, prefs.getString("streak", "0"))
        views.setTextViewText(R.id.progress_workouts, prefs.getString("monthly_workouts", "0"))
        views.setTextViewText(R.id.progress_calories, prefs.getString("today_calories", "0"))

        // Weekly bar chart data (comma-separated values 0-100)
        val bars = prefs.getString("weekly_bars", "")?.split(",") ?: emptyList()
        val barIds = listOf(R.id.progress_mon, R.id.progress_tue, R.id.progress_wed, R.id.progress_thu, R.id.progress_fri, R.id.progress_sat, R.id.progress_sun)
        val primaryColor = Color.parseColor("#10b981")
        val emptyColor = Color.parseColor("#27272a")

        for (i in barIds.indices) {
            val pct = bars.getOrElse(i) { "0" }.toIntOrNull() ?: 0
            val h = if (pct > 0) (12 + (pct * 0.4).toInt()) else 4
            views.setInt(barIds[i], "setHeight", h.dpToPx(ctx))
            views.setInt(barIds[i], "setBackgroundColor", if (pct > 0) primaryColor else emptyColor)
        }

        val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        val pi = PendingIntent.getActivity(ctx, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.progress_widget_container, pi)

        manager.updateAppWidget(id, views)
    }

    private fun Int.dpToPx(ctx: Context): Int = (this * ctx.resources.displayMetrics.density).toInt()
}
`,

    QuickWidgetProvider: `package ${PACKAGE}

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class QuickWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (id in ids) updateAppWidget(context, manager, id)
    }

    private fun updateAppWidget(ctx: Context, manager: AppWidgetManager, id: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.quick_widget_layout)

        val baseIntent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)

        // Workout button
        val workoutIntent = baseIntent?.clone()?.apply { putExtra("widget_action", "workout") }
        val workoutPi = PendingIntent.getActivity(ctx, 10, workoutIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.quick_workout_btn, workoutPi)

        // Water button
        val waterIntent = baseIntent?.clone()?.apply { putExtra("widget_action", "water") }
        val waterPi = PendingIntent.getActivity(ctx, 11, waterIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.quick_water_btn, waterPi)

        // Scan button
        val scanIntent = baseIntent?.clone()?.apply { putExtra("widget_action", "scan") }
        val scanPi = PendingIntent.getActivity(ctx, 12, scanIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.quick_scan_btn, scanPi)

        // Overall tap (fallback)
        val fallbackPi = PendingIntent.getActivity(ctx, 13, baseIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.quick_widget_container, fallbackPi)

        manager.updateAppWidget(id, views)
    }
}
`,
  };

  for (const [name, content] of Object.entries(providers)) {
    const filePath = path.join(dir, `${name}.kt`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
    }
  }
}

function createWidgetModule(projectRoot) {
  const dir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', ...PACKAGE.split('.'));
  fs.mkdirSync(dir, { recursive: true });

  const modulePath = path.join(dir, 'GymWidgetModule.kt');
  if (fs.existsSync(modulePath)) return;

  const content = `package ${PACKAGE}

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GymWidgetModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("GymWidget")

        Function("updateAllWidgets") {
            val ctx = appContext.reactContext ?: return@Function

            updateGymWidget(ctx)
            updateProgressWidget(ctx)
            updateQuickWidget(ctx)
        }

        Function("updateGymWidget") { date: String, volume: String, exercises: String, streak: String ->
            val ctx = appContext.reactContext ?: return@Function
            val prefs = ctx.getSharedPreferences("gym_widget_data", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("last_date", date)
                .putString("last_volume", volume)
                .putString("last_exercises", exercises)
                .putString("streak", streak)
                .apply()
            updateGymWidget(ctx)
            updateProgressWidget(ctx)
        }

        Function("updateProgressWidget") { streak: String, monthly: String, calories: String, weeklyBars: String ->
            val ctx = appContext.reactContext ?: return@Function
            val prefs = ctx.getSharedPreferences("gym_widget_data", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("streak", streak)
                .putString("monthly_workouts", monthly)
                .putString("today_calories", calories)
                .putString("weekly_bars", weeklyBars)
                .apply()
            updateProgressWidget(ctx)
        }
    }

    private fun updateGymWidget(ctx: Context) {
        val manager = AppWidgetManager.getInstance(ctx)
        val widgetClass = ComponentName(ctx, GymWidgetProvider::class.java)
        val views = RemoteViews(ctx.packageName, R.layout.gym_widget_layout)
        val prefs = ctx.getSharedPreferences("gym_widget_data", Context.MODE_PRIVATE)

        val lastDate = prefs.getString("last_date", null)
        val streak = prefs.getString("streak", "0")

        if (lastDate != null) {
            views.setTextViewText(R.id.widget_title, "\\uD83D\\uDCAA \\u00daltimo Entreno")
            views.setTextViewText(R.id.widget_subtitle, "$lastDate  |  " + prefs.getString("last_volume", "0") + " kg")
            views.setTextViewText(R.id.widget_body, prefs.getString("last_exercises", ""))
        } else {
            views.setTextViewText(R.id.widget_title, "\\uD83C\\uDFCB Exercises Gym")
            views.setTextViewText(R.id.widget_subtitle, "Toca para empezar")
            views.setTextViewText(R.id.widget_body, "")
        }
        views.setTextViewText(R.id.widget_streak_value, streak)

        val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        val pi = android.app.PendingIntent.getActivity(ctx, 0, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.widget_container, pi)
        manager.updateAppWidget(widgetClass, views)
    }

    private fun updateProgressWidget(ctx: Context) {
        val manager = AppWidgetManager.getInstance(ctx)
        val widgetClass = ComponentName(ctx, ProgressWidgetProvider::class.java)
        val views = RemoteViews(ctx.packageName, R.layout.progress_widget_layout)
        val prefs = ctx.getSharedPreferences("gym_widget_data", Context.MODE_PRIVATE)

        views.setTextViewText(R.id.progress_streak, prefs.getString("streak", "0"))
        views.setTextViewText(R.id.progress_workouts, prefs.getString("monthly_workouts", "0"))
        views.setTextViewText(R.id.progress_calories, prefs.getString("today_calories", "0"))

        val bars = prefs.getString("weekly_bars", "")?.split(",") ?: emptyList()
        val barIds = listOf(R.id.progress_mon, R.id.progress_tue, R.id.progress_wed, R.id.progress_thu, R.id.progress_fri, R.id.progress_sat, R.id.progress_sun)
        val primaryColor = Color.parseColor("#10b981")
        val emptyColor = Color.parseColor("#27272a")

        for (i in barIds.indices) {
            val pct = bars.getOrElse(i) { "0" }.toIntOrNull() ?: 0
            val h = if (pct > 0) (12 + (pct * 0.4).toInt()) else 4
            views.setInt(barIds[i], "setHeight", (h * ctx.resources.displayMetrics.density).toInt())
            views.setInt(barIds[i], "setBackgroundColor", if (pct > 0) primaryColor else emptyColor)
        }

        val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        val pi = android.app.PendingIntent.getActivity(ctx, 1, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.progress_widget_container, pi)
        manager.updateAppWidget(widgetClass, views)
    }

    private fun updateQuickWidget(ctx: Context) {
        val manager = AppWidgetManager.getInstance(ctx)
        val widgetClass = ComponentName(ctx, QuickWidgetProvider::class.java)
        val views = RemoteViews(ctx.packageName, R.layout.quick_widget_layout)

        val baseIntent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)

        val workoutIntent = baseIntent?.clone()?.apply { putExtra("widget_action", "workout") }
        views.setOnClickPendingIntent(R.id.quick_workout_btn, android.app.PendingIntent.getActivity(ctx, 10, workoutIntent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE))

        val waterIntent = baseIntent?.clone()?.apply { putExtra("widget_action", "water") }
        views.setOnClickPendingIntent(R.id.quick_water_btn, android.app.PendingIntent.getActivity(ctx, 11, waterIntent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE))

        val scanIntent = baseIntent?.clone()?.apply { putExtra("widget_action", "scan") }
        views.setOnClickPendingIntent(R.id.quick_scan_btn, android.app.PendingIntent.getActivity(ctx, 12, scanIntent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE))

        views.setOnClickPendingIntent(R.id.quick_widget_container, android.app.PendingIntent.getActivity(ctx, 13, baseIntent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE))

        manager.updateAppWidget(widgetClass, views)
    }
}
`;

  fs.writeFileSync(modulePath, content);

  const packagePath = path.join(dir, 'GymWidgetPackage.kt');
  if (fs.existsSync(packagePath)) return;

  const packageContent = `package ${PACKAGE}

import expo.modules.kotlin.ModuleProvider
import expo.modules.kotlin.modules.Module

class GymWidgetPackage : ModuleProvider {
    override fun getModules(): List<Class<out Module>> {
        return listOf(GymWidgetModule::class.java)
    }
}
`;
  fs.writeFileSync(packagePath, packageContent);
}

function withGymWidget(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = registerWidgetProviders(config.modResults);
    return config;
  });

  config = withMainApplication(config, (config) => {
    const src = config.modResults.contents;
    const importLine = 'import com.francisco.exercisesgym.GymWidgetPackage';
    if (src.includes(importLine)) return config;

    let modified = src;
    if (modified.includes('import expo.modules.ReactNativeHostWrapper')) {
      modified = modified.replace(
        'import expo.modules.ReactNativeHostWrapper',
        `import expo.modules.ReactNativeHostWrapper\n${importLine}`
      );
    }

    const packageAdd = '// Packages that cannot be autolinked yet can be added manually here, for example:';
    if (modified.includes(packageAdd)) {
      modified = modified.replace(
        '// add(MyReactNativePackage())',
        '// add(MyReactNativePackage())\n              add(GymWidgetPackage())'
      );
    }

    config.modResults.contents = modified;
    return config;
  });

  return config;
}

module.exports = function withGymWidgetPlugin(config) {
  try {
    const root = config.modRequest?.projectRoot || process.cwd();
    copyResources(root);
    createKotlinProviders(root);
    createWidgetModule(root);
  } catch (e) {
    console.warn('[withGymWidget] Failed to set up widget resources:', e.message);
  }
  return withGymWidget(config);
};
