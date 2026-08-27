namespace SynTrack.Client.Views;

using System.ComponentModel;
using System.Windows;
using SynTrack.Client.ViewModels;

public partial class MainWindow : Window
{
    /// <summary>Set by the tray "Exit" action so closing the window doesn't just hide it.</summary>
    public bool AllowClose { get; set; }

    public MainWindow(MainViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        if (!AllowClose)
        {
            e.Cancel = true;
            Hide();
            return;
        }

        base.OnClosing(e);
    }
}
