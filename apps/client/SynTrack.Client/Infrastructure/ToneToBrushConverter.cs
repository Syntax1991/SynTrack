namespace SynTrack.Client.Infrastructure;

using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

/// <summary>
/// Maps a status tone string ("positive"/"warning"/"error"/"neutral"/...)
/// to the matching status-dot brush. Hardcodes the same hex values as
/// Themes/Colors.xaml (SuccessBrush/WarningBrush/DangerBrush/TextMutedBrush)
/// rather than doing a resource lookup, since a converter has no XAML
/// context to bind through - keep the two in sync if the palette changes.
/// </summary>
public sealed class ToneToBrushConverter : IValueConverter
{
    private static readonly Brush Success = new SolidColorBrush(Color.FromRgb(0x47, 0xD5, 0x97));
    private static readonly Brush Warning = new SolidColorBrush(Color.FromRgb(0xF6, 0xB9, 0x4A));
    private static readonly Brush Danger = new SolidColorBrush(Color.FromRgb(0xFF, 0x6F, 0x78));
    private static readonly Brush Accent = new SolidColorBrush(Color.FromRgb(0x80, 0x58, 0xDD));
    private static readonly Brush Muted = new SolidColorBrush(Color.FromRgb(0x73, 0x7C, 0x91));

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) => (value as string) switch
    {
        "positive" => Success,
        "progress" => Warning,
        "warning" => Warning,
        "error" => Danger,
        "accent" => Accent,
        _ => Muted
    };

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>
/// Maps a WoW class name to its standard Blizzard class color (the same
/// well-known hex values used everywhere else in WoW UIs, including
/// SynTrack's own web app). Unknown/unmapped class names fall back to
/// plain primary text rather than guessing a color.
/// </summary>
public sealed class ClassNameToColorConverter : IValueConverter
{
    private static readonly Dictionary<string, Brush> ClassColors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Warrior"] = Brush(0xC7, 0x9C, 0x6E),
        ["Paladin"] = Brush(0xF5, 0x8C, 0xBA),
        ["Hunter"] = Brush(0xAB, 0xD4, 0x73),
        ["Rogue"] = Brush(0xFF, 0xF5, 0x69),
        ["Priest"] = Brush(0xFF, 0xFF, 0xFF),
        ["Death Knight"] = Brush(0xC4, 0x1F, 0x3B),
        ["Shaman"] = Brush(0x00, 0x70, 0xDE),
        ["Mage"] = Brush(0x69, 0xCC, 0xF0),
        ["Warlock"] = Brush(0x94, 0x82, 0xC9),
        ["Monk"] = Brush(0x00, 0xFF, 0x96),
        ["Druid"] = Brush(0xFF, 0x7D, 0x0A),
        ["Demon Hunter"] = Brush(0xA3, 0x30, 0xC9),
        ["Evoker"] = Brush(0x33, 0x93, 0x7F)
    };

    private static Brush Brush(byte r, byte g, byte b) => new SolidColorBrush(Color.FromRgb(r, g, b));

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is string className && ClassColors.TryGetValue(className, out var brush)
            ? brush
            : new SolidColorBrush(Color.FromRgb(0xF4, 0xF6, 0xFB));

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>Visible when the bound value is non-null; pass ConverterParameter="invert" to flip it.</summary>
public sealed class NullToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var hasValue = value is not null;

        if (string.Equals(parameter as string, "invert", StringComparison.OrdinalIgnoreCase))
        {
            hasValue = !hasValue;
        }

        return hasValue ? System.Windows.Visibility.Visible : System.Windows.Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

public sealed class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var flag = value is true;

        if (string.Equals(parameter as string, "invert", StringComparison.OrdinalIgnoreCase))
        {
            flag = !flag;
        }

        return flag ? System.Windows.Visibility.Visible : System.Windows.Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
